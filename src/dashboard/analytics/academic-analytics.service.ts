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

    // Pass mark standard: 40
    const PASS_MARK = 40;

    let totalScoreSum = 0;
    let scoredCount = 0;
    let passedCount = 0;
    let failingCount = 0;

    // Student level tracking
    const studentScoreMap = new Map<
      string,
      { totalScore: number; count: number }
    >();

    // Class level tracking
    const classMap = new Map<
      string,
      { className: string; scores: number[]; passed: number }
    >();

    // Subject level tracking
    const subjectMap = new Map<
      string,
      { subjectName: string; scores: number[]; passed: number }
    >();

    for (const sr of studentResults) {
      const score = sr.totalScore ?? sr.percentage ?? 0;
      if (score > 0) {
        totalScoreSum += score;
        scoredCount++;
        if (score >= PASS_MARK) {
          passedCount++;
        }

        const prevStudent = studentScoreMap.get(sr.studentId) || {
          totalScore: 0,
          count: 0,
        };
        prevStudent.totalScore += score;
        prevStudent.count++;
        studentScoreMap.set(sr.studentId, prevStudent);
      }

      // Class grouping
      const classId = sr.resultSheet?.classId;
      const className = sr.resultSheet?.classEntity?.name || 'Class';
      if (classId) {
        const clsData = classMap.get(classId) || {
          className,
          scores: [],
          passed: 0,
        };
        if (score > 0) {
          clsData.scores.push(score);
          if (score >= PASS_MARK) clsData.passed++;
        }
        classMap.set(classId, clsData);
      }

      // Subject scores grouping
      if (sr.subjectScores && sr.subjectScores.length > 0) {
        for (const ss of sr.subjectScores) {
          const subId = ss.subjectId;
          const subName = ss.subject?.name || 'Subject';
          const subScore = ss.totalScore;
          if (subId && typeof subScore === 'number' && subScore >= 0) {
            const subData = subjectMap.get(subId) || {
              subjectName: subName,
              scores: [],
              passed: 0,
            };
            subData.scores.push(subScore);
            if (subScore >= PASS_MARK) subData.passed++;
            subjectMap.set(subId, subData);
          }
        }
      }
    }

    for (const [, stData] of studentScoreMap.entries()) {
      const studentAvg = stData.totalScore / (stData.count || 1);
      if (studentAvg < PASS_MARK) {
        failingCount++;
      }
    }

    const overallAverageScore =
      scoredCount > 0
        ? Math.round((totalScoreSum / scoredCount) * 10) / 10
        : 0;
    const overallPassRate =
      scoredCount > 0
        ? Math.round((passedCount / scoredCount) * 100 * 10) / 10
        : 0;

    // Build subject performances
    const subjectPerformances: SubjectPerformanceItem[] = [];
    for (const [subjectId, data] of subjectMap.entries()) {
      if (data.scores.length === 0) continue;
      const subSum = data.scores.reduce((a, b) => a + b, 0);
      const avg = Math.round((subSum / data.scores.length) * 10) / 10;
      const highest = Math.max(...data.scores);
      const lowest = Math.min(...data.scores);
      const passRate =
        Math.round((data.passed / data.scores.length) * 100 * 10) / 10;

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
      if (data.scores.length === 0) continue;
      const clsSum = data.scores.reduce((a, b) => a + b, 0);
      const avg = Math.round((clsSum / data.scores.length) * 10) / 10;
      const passRate =
        Math.round((data.passed / data.scores.length) * 100 * 10) / 10;

      classPerformances.push({
        classId,
        className: data.className,
        averageScore: avg,
        passRate,
        totalStudents: data.scores.length,
      });
    }
    classPerformances.sort((a, b) => b.averageScore - a.averageScore);

    return {
      overallAverageScore,
      overallPassRate,
      studentsNeedingAttentionCount: failingCount,
      subjectPerformances,
      classPerformances,
    };
  }
}
