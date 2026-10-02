import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultSheet } from '../../results/entities/result-sheet.entity';
import { ClassSubject } from '../../classes/entities/class-subject.entity';
import { User } from '../../users/entities/user.entity';
import { Term } from '../../terms/entities/term.entity';
import { ResultStatus, TermStatus } from '../../common/enums';
import {
  DashboardResultSubmissionStatus,
  TeacherPendingSubmissionItem,
} from '../dto/dashboard-analytics.type';

@Injectable()
export class ResultSubmissionAnalyticsService {
  constructor(
    @InjectRepository(ResultSheet)
    private readonly resultSheetRepo: Repository<ResultSheet>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectRepo: Repository<ClassSubject>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
  ) {}

  async getResultSubmissionStatus(
    schoolId: string,
    termId?: string,
  ): Promise<DashboardResultSubmissionStatus> {
    let targetTermId = termId;

    if (!targetTermId) {
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      targetTermId = activeTerm?.id;
    }

    // Find all result sheets for this school (and term if available)
    const sheetsQb = this.resultSheetRepo
      .createQueryBuilder('sheet')
      .leftJoinAndSelect('sheet.classEntity', 'classEntity')
      .where('sheet.schoolId = :schoolId', { schoolId })
      .andWhere('sheet.isArchived = false');

    if (targetTermId) {
      sheetsQb.andWhere('sheet.termId = :termId', { termId: targetTermId });
    }

    const sheets = await sheetsQb.getMany();

    const submittedStatuses = [
      ResultStatus.SCORES_ENTERED,
      ResultStatus.PENDING_ADMIN_REVIEW,
      ResultStatus.PENDING_PRINCIPAL_APPROVAL,
      ResultStatus.PUBLISHED,
    ];

    let submittedSheets = 0;
    let pendingSheets = 0;

    for (const sheet of sheets) {
      if (submittedStatuses.includes(sheet.status)) {
        submittedSheets++;
      } else {
        pendingSheets++;
      }
    }

    const totalExpectedSheets = sheets.length;
    const completionPercentage =
      totalExpectedSheets > 0
        ? Math.min(
            100,
            Math.round((submittedSheets / totalExpectedSheets) * 100 * 10) / 10,
          )
        : 0;

    // Identify teachers with pending submissions
    const pendingClassIds = sheets
      .filter((s) => !submittedStatuses.includes(s.status))
      .map((s) => s.classId);

    const teacherPendingMap = new Map<
      string,
      {
        pendingCount: number;
        classNames: Set<string>;
        subjectNames: Set<string>;
      }
    >();

    if (pendingClassIds.length > 0) {
      const classSubjects = await this.classSubjectRepo.find({
        where: { classId: In(pendingClassIds) },
        relations: ['classEntity', 'subject'],
      });

      for (const cs of classSubjects) {
        const teacherId =
          cs.subjectTeacherId || cs.teacherId || (cs.teacherIds && cs.teacherIds[0]);
        if (!teacherId) continue;

        const prev = teacherPendingMap.get(teacherId) || {
          pendingCount: 0,
          classNames: new Set<string>(),
          subjectNames: new Set<string>(),
        };

        prev.pendingCount++;
        if (cs.classEntity?.name) prev.classNames.add(cs.classEntity.name);
        if (cs.subject?.name) prev.subjectNames.add(cs.subject.name);
        teacherPendingMap.set(teacherId, prev);
      }
    }

    const teachersWithPendingSubmissions: TeacherPendingSubmissionItem[] = [];
    const teacherIds = Array.from(teacherPendingMap.keys());

    if (teacherIds.length > 0) {
      const teachers = await this.userRepo.find({
        where: { id: In(teacherIds) },
      });
      const teacherMap = new Map(teachers.map((t) => [t.id, t]));

      for (const [tId, data] of teacherPendingMap.entries()) {
        const tUser = teacherMap.get(tId);
        const name = tUser
          ? `${tUser.firstName} ${tUser.lastName}`.trim()
          : 'Teacher';

        teachersWithPendingSubmissions.push({
          teacherId: tId,
          teacherName: name,
          pendingCount: data.pendingCount,
          classNames: Array.from(data.classNames),
          subjectNames: Array.from(data.subjectNames),
        });
      }

      teachersWithPendingSubmissions.sort(
        (a, b) => b.pendingCount - a.pendingCount,
      );
    }

    return {
      totalExpectedSheets,
      submittedSheets,
      pendingSheets,
      completionPercentage,
      teachersWithPendingSubmissions: teachersWithPendingSubmissions.slice(0, 10),
    };
  }
}
