import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultSheet } from '../../results/entities/result-sheet.entity';
import { StudentResult } from '../../results/entities/student-result.entity';
import { SubjectScore } from '../../results/entities/subject-score.entity';
import { Term } from '../../terms/entities/term.entity';
import { TermStatus } from '../../common/enums';
import {
  DashboardAcademicPerformance,
  SubjectPerformanceItem,
  ClassPerformanceItem,
} from '../dto/dashboard-analytics.type';

@Injectable()
export class AcademicAnalyticsService {
  constructor(
    @InjectRepository(ResultSheet)
    private readonly resultSheetRepo: Repository<ResultSheet>,
    @InjectRepository(StudentResult)
    private readonly studentResultRepo: Repository<StudentResult>,
    @InjectRepository(SubjectScore)
    private readonly subjectScoreRepo: Repository<SubjectScore>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
  ) {}

  async getAcademicPerformance(
    schoolId: string,
    termId?: string,
  ): Promise<DashboardAcademicPerformance> {
    let targetTermId = termId;

    if (!targetTermId) {
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      targetTermId = activeTerm?.id;
    }

    // Find result sheets for the school
    const sheetsQb = this.resultSheetRepo
      .createQueryBuilder('sheet')
      .leftJoinAndSelect('sheet.classEntity', 'classEntity')
      .where('sheet.schoolId = :schoolId', { schoolId })
      .andWhere('sheet.isArchived = false');

    if (targetTermId) {
      sheetsQb.andWhere('sheet.termId = :termId', { termId: targetTermId });
    }

    const sheets = await sheetsQb.getMany();
    const sheetIds = sheets.map((s) => s.id);

    if (sheetIds.length === 0) {
      return {
        overallAverageScore: 0,
        overallPassRate: 0,
        studentsNeedingAttentionCount: 0,
        subjectPerformances: [],
        classPerformances: [],
      };
    }

    // Map each sheet to its totalMaxPerSubject
    const sheetMaxScoreMap = new Map<string, number>();
    for (const s of sheets) {
      const totalMax = (s.scoreComponents || []).reduce(
        (sum, sc) => sum + (sc.maxScore || 0),
        0,
      );
      sheetMaxScoreMap.set(s.id, totalMax > 0 ? totalMax : 100);
    }

    // Fetch all student results for these sheets
    const studentResults = await this.studentResultRepo
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.resultSheet', 'sheet')
      .leftJoinAndSelect('sheet.classEntity', 'classEntity')
      .leftJoinAndSelect('sr.subjectScores', 'ss')
      .leftJoinAndSelect('ss.subject', 'subject')
      .where('sr.resultSheetId IN (:...sheetIds)', { sheetIds })
      .getMany();

    if (studentResults.length === 0) {
      return {
        overallAverageScore: 0,
        overallPassRate: 0,
        studentsNeedingAttentionCount: 0,
        subjectPerformances: [],
        classPerformances: [],
      };
    }

    const PASS_MARK = 40; // 40% standard pass mark

    // Student percentage map: studentId -> array of percentage scores across broadsheets
    const studentPercentages: number[] = [];
    let passedStudentsCount = 0;
    let failingStudentsCount = 0;

    // Class level tracking: classId -> { className, studentPercentages }
    const classMap = new Map<
      string,
      { className: string; percentages: number[]; passedCount: number }
    >();

    // Subject level tracking: subjectId -> { subjectName, scores (out of 100), passedCount }
    const subjectMap = new Map<
      string,
      { subjectName: string; scores: number[]; passedCount: number }
    >();

    for (const sr of studentResults) {
      const sheetMaxPerSubject = sheetMaxScoreMap.get(sr.resultSheetId) || 100;
      const subjectCount = sr.subjectScores?.length || 1;
      const overallObtainable = sheetMaxPerSubject * subjectCount;

      let studentPct: number | null = null;

      if (
        typeof sr.percentage === 'number' &&
        sr.percentage > 0 &&
        sr.percentage <= 100
      ) {
        studentPct = sr.percentage;
      } else if (
        typeof sr.totalScore === 'number' &&
        sr.totalScore > 0 &&
        overallObtainable > 0
      ) {
        // Compute normalized percentage out of 100
        studentPct = Math.min(
          100,
          Math.round((sr.totalScore / overallObtainable) * 100 * 10) / 10,
        );
      } else if (sr.subjectScores && sr.subjectScores.length > 0) {
        const validSubjectScores = sr.subjectScores.filter(
          (ss) => typeof ss.totalScore === 'number' && ss.totalScore >= 0,
        );
        if (validSubjectScores.length > 0) {
          const sum = validSubjectScores.reduce(
            (acc, ss) => acc + (ss.totalScore || 0),
            0,
          );
          const obtainable = sheetMaxPerSubject * validSubjectScores.length;
          studentPct =
            obtainable > 0
              ? Math.min(100, Math.round((sum / obtainable) * 100 * 10) / 10)
              : null;
        }
      }

      if (studentPct !== null && studentPct >= 0) {
        studentPercentages.push(studentPct);
        if (studentPct >= PASS_MARK) {
          passedStudentsCount++;
        } else {
          failingStudentsCount++;
        }

        // Class grouping
        const classId = sr.resultSheet?.classId;
        const className = sr.resultSheet?.classEntity?.name || 'Class';
        if (classId) {
          const clsData = classMap.get(classId) || {
            className,
            percentages: [],
            passedCount: 0,
          };
          clsData.percentages.push(studentPct);
          if (studentPct >= PASS_MARK) {
            clsData.passedCount++;
          }
          classMap.set(classId, clsData);
        }
      }

      // Subject scores grouping (normalized to 100%)
      if (sr.subjectScores && sr.subjectScores.length > 0) {
        for (const ss of sr.subjectScores) {
          const subId = ss.subjectId;
          const subName = ss.subject?.name || 'Subject';
          const rawScore = ss.totalScore;

          if (subId && typeof rawScore === 'number' && rawScore >= 0) {
            const normalizedScore =
              sheetMaxPerSubject > 0
                ? Math.min(
                    100,
                    Math.round((rawScore / sheetMaxPerSubject) * 100 * 10) / 10,
                  )
                : Math.min(100, rawScore);

            const subData = subjectMap.get(subId) || {
              subjectName: subName,
              scores: [],
              passedCount: 0,
            };
            subData.scores.push(normalizedScore);
            if (normalizedScore >= PASS_MARK) {
              subData.passedCount++;
            }
            subjectMap.set(subId, subData);
          }
        }
      }
    }

    const assessedCount = studentPercentages.length;
    const overallAverageScore =
      assessedCount > 0
        ? Math.min(
            100,
            Math.round(
              (studentPercentages.reduce((a, b) => a + b, 0) / assessedCount) *
                10,
            ) / 10,
          )
        : 0;

    const overallPassRate =
      assessedCount > 0
        ? Math.min(
            100,
            Math.round((passedStudentsCount / assessedCount) * 100 * 10) / 10,
          )
        : 0;

    // Build subject performances
    const subjectPerformances: SubjectPerformanceItem[] = [];
    for (const [subjectId, data] of subjectMap.entries()) {
      if (data.scores.length === 0) continue;
      const subSum = data.scores.reduce((a, b) => a + b, 0);
      const avg = Math.min(
        100,
        Math.round((subSum / data.scores.length) * 10) / 10,
      );
      const highest = Math.min(100, Math.max(...data.scores));
      const lowest = Math.max(0, Math.min(...data.scores));
      const passRate = Math.min(
        100,
        Math.round((data.passedCount / data.scores.length) * 100 * 10) / 10,
      );

      subjectPerformances.push({
        subjectId,
        subjectName: data.subjectName,
        averageScore: avg,
        highestScore: highest,
        lowestScore: lowest,
        passRate,
        totalStudents: data.scores.length,
      });
    }
    subjectPerformances.sort((a, b) => b.averageScore - a.averageScore);

    // Build class performances
    const classPerformances: ClassPerformanceItem[] = [];
    for (const [classId, data] of classMap.entries()) {
      if (data.percentages.length === 0) continue;
      const clsSum = data.percentages.reduce((a, b) => a + b, 0);
      const avg = Math.min(
        100,
        Math.round((clsSum / data.percentages.length) * 10) / 10,
      );
      const passRate = Math.min(
        100,
        Math.round((data.passedCount / data.percentages.length) * 100 * 10) /
          10,
      );

      classPerformances.push({
        classId,
        className: data.className,
        averageScore: avg,
        passRate,
        totalStudents: data.percentages.length,
      });
    }
    classPerformances.sort((a, b) => b.averageScore - a.averageScore);

    return {
      overallAverageScore,
      overallPassRate,
      studentsNeedingAttentionCount: failingStudentsCount,
      subjectPerformances,
      classPerformances,
    };
  }
}
