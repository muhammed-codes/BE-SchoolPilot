import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, ArrayContains } from 'typeorm';
import { UserRole } from '../common/enums/role.enum';
import { AppResource } from './enums/resource.enum';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ResultSheet } from '../results/entities/result-sheet.entity';
import { StudentResult } from '../results/entities/student-result.entity';
import { SubjectScore } from '../results/entities/subject-score.entity';
import { Session } from '../terms/entities/session.entity';
import { Term } from '../terms/entities/term.entity';

export interface ScopeUser {
  sub: string;
  schoolId?: string | null;
  role: UserRole;
}
@Injectable()
export class RecordScopeService {
  constructor(private readonly db: DataSource) {}

  async assertClass(user: ScopeUser, id: string) {
    if (!user.schoolId)
      throw new ForbiddenException('A school scope is required');
    const record = await this.db
      .getRepository(ClassEntity)
      .findOneBy({ id, schoolId: user.schoolId });
    if (!record) throw new ForbiddenException('Class is outside your school');
    if (
      user.role === UserRole.CLASS_TEACHER &&
      record.classTeacherId !== user.sub
    )
      throw new ForbiddenException('Class is not assigned to you');
    if (user.role === UserRole.SUBJECT_TEACHER) {
      const assigned = await this.db.getRepository(ClassSubject).findOne({
        where: [
          { classId: id, schoolId: user.schoolId, subjectTeacherId: user.sub },
          {
            classId: id,
            schoolId: user.schoolId,
            teacherIds: ArrayContains([user.sub]),
          },
        ],
      });
      if (!assigned)
        throw new ForbiddenException('Class is not assigned to you');
    }
    if (user.role === UserRole.PARENT)
      throw new ForbiddenException('Use linked-child endpoints');
  }

  async assertStudent(user: ScopeUser, id: string) {
    if (!user.schoolId)
      throw new ForbiddenException('A school scope is required');
    const record = await this.db
      .getRepository(Student)
      .findOneBy({ id, schoolId: user.schoolId });
    if (!record) throw new ForbiddenException('Student is outside your school');
    if (user.role === UserRole.PARENT) {
      if (
        !(await this.db
          .getRepository(StudentParent)
          .findOneBy({ studentId: id, parentId: user.sub }))
      )
        throw new ForbiddenException('Student is not linked to you');
    } else if (
      [UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER].includes(user.role)
    ) {
      await this.assertClass(user, record.currentClassId);
    }
  }

  async assertArguments(
    user: ScopeUser,
    resource: AppResource,
    args: Record<string, unknown>,
    operation: string,
  ) {
    // Platform administrators use explicitly platform-scoped services. School admins
    // remain subject to tenant checks, even though module DENY does not apply.
    if (user.role === UserRole.SUPER_ADMIN) return;
    const academic = [
      AppResource.STUDENTS,
      AppResource.CLASSES,
      AppResource.SUBJECTS,
      AppResource.ATTENDANCE,
      AppResource.RESULTS,
      AppResource.TIMETABLE,
      AppResource.FEES,
      AppResource.ID_CARDS,
    ];
    if (!academic.includes(resource)) return;
    if (!user.schoolId)
      throw new ForbiddenException('A school scope is required');
    const restricted = [
      UserRole.CLASS_TEACHER,
      UserRole.SUBJECT_TEACHER,
      UserRole.PARENT,
    ].includes(user.role);
    if (
      restricted &&
      [
        'archivedStudents',
        'guardianStudents',
        'staffAttendanceLog',
        'staffAttendanceOverview',
        'classAttendanceOverview',
        'unmarkedClasses',
        'manualStaffAttendance',
      ].includes(operation)
    )
      throw new ForbiddenException(
        'School-wide operation is not available for this role',
      );
    if (
      user.role === UserRole.PARENT &&
      [
        'searchStudents',
        'studentsPage',
        'studentStatistics',
        'schoolClasses',
        'classes',
        'myClasses',
      ].includes(operation)
    )
      throw new ForbiddenException('Use linked-child endpoints');
    if (
      user.role === UserRole.PARENT &&
      ![
        'student',
        'myChildren',
        'studentAttendance',
        'studentAttendanceSummary',
        'studentResult',
        'myChildResults',
        'childTimetable',
        'myChildrenTimetables',
        'myAnnouncements',
        'unreadAnnouncementCount',
        'myChildInvoices',
        'myStudentInvoices',
        'invoice',
        'paymentSubmission',
        'paymentReceipt',
        'bankAccounts',
        'studentInvoices',
        'studentFeeSummary',
      ].includes(operation)
    ) {
      throw new ForbiddenException('Use linked-child endpoints');
    }
    if (
      user.role === UserRole.SUBJECT_TEACHER &&
      ['classScores', 'resultAnalytics'].includes(operation) &&
      (!args.subjectId || args.subjectId === 'ALL')
    )
      throw new ForbiddenException('Select an assigned subject');
    if (restricted && operation === 'pendingPrincipalApprovals')
      throw new ForbiddenException(
        'School-wide approval list is not available for this role',
      );
    if (
      user.role === UserRole.SUBJECT_TEACHER &&
      [
        'studentResult',
        'studentResultsByTerm',
        'studentResultsHistory',
      ].includes(operation)
    )
      throw new ForbiddenException('Use assigned-subject scores');
    // PDF exports use targetId rather than classId; validate before generating.
    if (operation === 'exportTimetablePdf') {
      const input = args.input as
        | { viewType?: string; targetId?: string }
        | undefined;
      if (input?.viewType === 'CLASS' && input.targetId)
        await this.assertClass(user, input.targetId);
      if (
        restricted &&
        !(input?.viewType === 'CLASS' && input.targetId) &&
        !(input?.viewType === 'TEACHER' && input.targetId === user.sub)
      ) {
        throw new ForbiddenException(
          'Export only your assigned class or personal timetable',
        );
      }
    }
    const visit = async (value: unknown): Promise<void> => {
      if (Array.isArray(value)) {
        for (const item of value) await visit(item);
        return;
      }
      if (!value || typeof value !== 'object') return;
      for (const [key, item] of Object.entries(value)) {
        if (typeof item === 'string' && item) {
          if (
            key === 'sessionId' &&
            !(await this.db
              .getRepository(Session)
              .findOneBy({ id: item, schoolId: user.schoolId! }))
          )
            throw new ForbiddenException('Session is outside your school');
          if (key === 'subjectScoreId') {
            const score = await this.db
              .getRepository(SubjectScore)
              .findOneBy({ id: item });
            if (!score) throw new ForbiddenException('Score not found');
            await visit({
              resultSheetId: score.resultSheetId,
              subjectId: score.subjectId,
              studentResultId: score.studentResultId,
            });
          }

          if (
            [
              'teacherId',
              'classTeacherId',
              'subjectTeacherId',
              'parentUserId',
            ].includes(key) &&
            !(await this.db
              .getRepository(User)
              .findOneBy({ id: item, schoolId: user.schoolId! }))
          )
            throw new ForbiddenException(
              'Assigned user is outside your school',
            );
          if (
            key === 'resultSheetId' ||
            (key === 'id' && operation === 'resultSheet')
          ) {
            const sheet = await this.db
              .getRepository(ResultSheet)
              .findOneBy({ id: item, schoolId: user.schoolId! });
            if (!sheet)
              throw new ForbiddenException(
                'Result sheet is outside your school',
              );
            await this.assertClass(user, sheet.classId);
            const subjectId = (value as Record<string, unknown>).subjectId;
            if (
              user.role === UserRole.SUBJECT_TEACHER &&
              typeof subjectId === 'string'
            ) {
              const base = {
                classId: sheet.classId,
                subjectId,
                schoolId: user.schoolId!,
              };
              if (
                !(await this.db.getRepository(ClassSubject).findOne({
                  where: [
                    { ...base, subjectTeacherId: user.sub },
                    { ...base, teacherIds: ArrayContains([user.sub]) },
                  ],
                }))
              )
                throw new ForbiddenException(
                  'Subject is not assigned in this class',
                );
            }
          }
          if (key === 'studentResultId') {
            const result = await this.db
              .getRepository(StudentResult)
              .findOneBy({ id: item, schoolId: user.schoolId! });
            if (!result)
              throw new ForbiddenException('Result is outside your school');
            await this.assertStudent(user, result.studentId);
          }
          if (
            key === 'studentId' ||
            (key === 'id' && resource === AppResource.STUDENTS)
          )
            await this.assertStudent(user, item);
          if (
            [
              'classId',
              'currentClassId',
              'admissionClassId',
              'fromClassId',
              'toClassId',
            ].includes(key) ||
            (key === 'id' && resource === AppResource.CLASSES)
          )
            await this.assertClass(user, item);
          if (
            key === 'termId' &&
            !(await this.db
              .getRepository(Term)
              .findOneBy({ id: item, schoolId: user.schoolId! }))
          )
            throw new ForbiddenException('Term is outside your school');
          if (
            (key === 'subjectId' && item !== 'ALL') ||
            (key === 'id' && resource === AppResource.SUBJECTS)
          ) {
            if (
              !(await this.db
                .getRepository(Subject)
                .findOneBy({ id: item, schoolId: user.schoolId! }))
            )
              throw new ForbiddenException('Subject is outside your school');
            if (user.role === UserRole.SUBJECT_TEACHER) {
              const classId =
                typeof (value as Record<string, unknown>).classId === 'string'
                  ? (value as Record<string, string>).classId
                  : undefined;
              const base = {
                schoolId: user.schoolId!,
                subjectId: item,
                ...(classId ? { classId } : {}),
              };
              if (
                !(await this.db.getRepository(ClassSubject).findOne({
                  where: [
                    { ...base, subjectTeacherId: user.sub },
                    { ...base, teacherIds: ArrayContains([user.sub]) },
                  ],
                }))
              )
                throw new ForbiddenException('Subject is not assigned to you');
            }
          }
        } else if (key === 'subjectIds' && Array.isArray(item)) {
          for (const id of item)
            if (typeof id === 'string') await visit({ subjectId: id });
        } else if (key === 'studentIds' && Array.isArray(item)) {
          for (const id of item)
            if (typeof id === 'string') await this.assertStudent(user, id);
        } else await visit(item);
      }
    };
    await visit(args);
  }
}
