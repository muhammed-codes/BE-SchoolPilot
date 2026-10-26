import { Injectable, ForbiddenException } from '@nestjs/common';
import { AccessService } from '../access/access.service';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Term } from '../terms/entities/term.entity';
import { TermStatus, UserRole } from '../common/enums';
import {
  SCHOOL_STAFF_ROLES,
  TEACHER_ROLES,
} from '../common/constants/roles.constant';
import { ClassesService } from '../classes/classes.service';
import { DashboardOverview } from './dto/dashboard-overview.type';
import {
  DashboardAnalytics,
  DashboardIncomeAnalytics,
  DashboardAttendanceAnalytics,
  DashboardFeeCollectionOverview,
} from './dto/dashboard-analytics.type';
import {
  DashboardAnalyticsInput,
  DashboardTimeFilter,
  AttendancePeriodFilter,
} from './dto/dashboard-analytics.input';
import { createMetricStat } from '../common/dto/metric-stat.type';

import { TermAnalyticsService } from './analytics/term-analytics.service';
import { KpiAnalyticsService } from './analytics/kpi-analytics.service';
import { FinancialAnalyticsService } from './analytics/financial-analytics.service';
import { AttendanceAnalyticsService } from './analytics/attendance-analytics.service';
import { AcademicAnalyticsService } from './analytics/academic-analytics.service';
import { ResultSubmissionAnalyticsService } from './analytics/result-submission-analytics.service';
import { GuardianAnalyticsService } from './analytics/guardian-analytics.service';
import { StaffAnalyticsService } from './analytics/staff-analytics.service';
import { NeedsAttentionAnalyticsService } from './analytics/needs-attention-analytics.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly accessService: AccessService,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    private readonly classesService: ClassesService,
    private readonly termAnalyticsService: TermAnalyticsService,
    private readonly kpiAnalyticsService: KpiAnalyticsService,
    private readonly financialAnalyticsService: FinancialAnalyticsService,
    private readonly attendanceAnalyticsService: AttendanceAnalyticsService,
    private readonly academicAnalyticsService: AcademicAnalyticsService,
    private readonly resultSubmissionAnalyticsService: ResultSubmissionAnalyticsService,
    private readonly guardianAnalyticsService: GuardianAnalyticsService,
    private readonly staffAnalyticsService: StaffAnalyticsService,
    private readonly needsAttentionAnalyticsService: NeedsAttentionAnalyticsService,
  ) {}

  async getDashboardAnalytics(
    schoolId: string,
    input: DashboardAnalyticsInput = {},
    user?: { sub: string; role: UserRole },
  ): Promise<DashboardAnalytics> {
    const {
      incomeTimeFilter = DashboardTimeFilter.MONTH,
      attendanceTimeFilter = AttendancePeriodFilter.WEEK,
      sessionId,
      termId,
    } = input;

    if (!schoolId || !user)
      throw new ForbiddenException('Authenticated school scope required');
    const teacher = TEACHER_ROLES.includes(user.role);
    const parent = user.role === UserRole.PARENT;
    const allowed = async (...resources: AppResource[]) => {
      if (teacher || parent) return false; // These roles use assigned-record dashboards.
      return (
        await Promise.all(
          resources.map((resource) =>
            this.accessService.hasPermission(
              user.sub,
              user.role,
              schoolId,
              resource,
              PermissionAction.READ,
            ),
          ),
        )
      ).every(Boolean);
    };
    const [students, classes, fees, attendance, results, users, all] =
      await Promise.all([
        allowed(AppResource.STUDENTS),
        allowed(AppResource.CLASSES),
        allowed(AppResource.FEES),
        allowed(AppResource.ATTENDANCE),
        allowed(AppResource.RESULTS),
        allowed(AppResource.USERS),
        allowed(
          AppResource.STUDENTS,
          AppResource.CLASSES,
          AppResource.USERS,
          AppResource.FEES,
          AppResource.ATTENDANCE,
          AppResource.RESULTS,
        ),
      ]);
    const [
      termProgress,
      kpis,
      incomeAnalytics,
      feeCollectionOverview,
      studentDemographics,
      classDistribution,
      attendanceAnalytics,
      academicPerformance,
      resultSubmissionStatus,
      guardianOverview,
      staffOverview,
      needsAttention,
    ] = await Promise.all([
      this.termAnalyticsService.getTermProgress(schoolId, termId, sessionId),
      all ? this.kpiAnalyticsService.getOverviewKpis(schoolId) : undefined,
      fees
        ? this.financialAnalyticsService.getIncomeAnalytics(
            schoolId,
            incomeTimeFilter,
            termId,
          )
        : undefined,
      fees
        ? this.financialAnalyticsService.getFeeCollectionOverview(
            schoolId,
            termId,
            sessionId,
          )
        : undefined,
      students
        ? this.kpiAnalyticsService.getStudentDemographics(schoolId)
        : undefined,
      classes && students
        ? this.kpiAnalyticsService.getClassDistribution(schoolId)
        : undefined,
      attendance
        ? this.attendanceAnalyticsService.getAttendanceAnalytics(
            schoolId,
            attendanceTimeFilter,
            termId,
          )
        : undefined,
      results
        ? this.academicAnalyticsService.getAcademicPerformance(schoolId, termId)
        : undefined,
      results && users
        ? this.resultSubmissionAnalyticsService.getResultSubmissionStatus(
            schoolId,
            termId,
          )
        : undefined,
      students && users
        ? this.guardianAnalyticsService.getGuardianOverview(schoolId)
        : undefined,
      users && attendance
        ? this.staffAnalyticsService.getStaffOverview(schoolId)
        : undefined,
      all
        ? this.needsAttentionAnalyticsService.getNeedsAttentionItems(
            schoolId,
            termId,
          )
        : undefined,
    ]);
    return {
      termProgress,
      kpis,
      incomeAnalytics,
      feeCollectionOverview,
      studentDemographics,
      classDistribution,
      attendanceAnalytics,
      academicPerformance,
      resultSubmissionStatus,
      guardianOverview,
      staffOverview,
      needsAttention,
    };
  }

  async getDashboardIncomeAnalytics(
    schoolId: string,
    filter: DashboardTimeFilter = DashboardTimeFilter.MONTH,
    termId?: string,
  ): Promise<DashboardIncomeAnalytics> {
    return this.financialAnalyticsService.getIncomeAnalytics(
      schoolId,
      filter,
      termId,
    );
  }

  async getDashboardAttendanceAnalytics(
    schoolId: string,
    filter: AttendancePeriodFilter = AttendancePeriodFilter.WEEK,
    termId?: string,
  ): Promise<DashboardAttendanceAnalytics> {
    return this.attendanceAnalyticsService.getAttendanceAnalytics(
      schoolId,
      filter,
      termId,
    );
  }

  async getDashboardFeeCollectionOverview(
    schoolId: string,
    termId?: string,
    sessionId?: string,
  ): Promise<DashboardFeeCollectionOverview> {
    return this.financialAnalyticsService.getFeeCollectionOverview(
      schoolId,
      termId,
      sessionId,
    );
  }

  async getDashboardOverview(
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<DashboardOverview> {
    if (!schoolId) {
      return {
        studentsCount: createMetricStat(0, null, null, false),
        teachersCount: createMetricStat(0, null, null, true),
        classesCount: createMetricStat(0, null, null, true),
        recentStudents: [],
      };
    }

    const can = (resource: AppResource) =>
      this.accessService.hasPermission(
        userId,
        role,
        schoolId,
        resource,
        PermissionAction.READ,
      );
    const [canReadStudents, canReadUsers, canReadClasses] = await Promise.all([
      can(AppResource.STUDENTS),
      can(AppResource.USERS),
      can(AppResource.CLASSES),
    ]);
    try {
      const isTeacher = TEACHER_ROLES.includes(role);
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      const hasActiveTerm = !!activeTerm;

      if (isTeacher) {
        const myClasses = await this.classesService.getClassesForTeacher(
          userId,
          schoolId,
          role,
        );
        const classIds = myClasses.map((c) => c.id);

        const teachersCount = 0; // Teacher dashboards never expose the staff directory count.

        const rawStudentsCount =
          canReadStudents && classIds.length > 0
            ? await this.studentRepo.count({
                where: {
                  schoolId,
                  currentClassId: In(classIds),
                  isArchived: false,
                },
              })
            : 0;

        const recentStudents =
          canReadStudents && classIds.length > 0
            ? await this.studentRepo.find({
                where: {
                  schoolId,
                  currentClassId: In(classIds),
                  isArchived: false,
                },
                relations: ['currentClass', 'admissionClass'],
                order: { createdAt: 'DESC' },
                take: 10,
              })
            : [];

        return {
          studentsCount: createMetricStat(
            rawStudentsCount,
            null,
            null,
            hasActiveTerm,
          ),
          teachersCount: createMetricStat(teachersCount, null, null, true),
          classesCount: createMetricStat(
            canReadClasses ? myClasses.length : 0,
            null,
            null,
            true,
          ),
          recentStudents,
        };
      }

      // Admin flow
      const rawStudentsCount = canReadStudents
        ? await this.studentRepo.count({
            where: { schoolId, isArchived: false },
          })
        : 0;

      const rawTeachersCount = canReadUsers
        ? await this.userRepo.count({
            where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
          })
        : 0;

      const rawClassesCount = canReadClasses
        ? await this.classRepo.count({
            where: { schoolId },
          })
        : 0;

      const recentStudents = canReadStudents
        ? await this.studentRepo.find({
            where: { schoolId, isArchived: false },
            relations: ['currentClass', 'admissionClass'],
            order: { createdAt: 'DESC' },
            take: 10,
          })
        : [];

      return {
        studentsCount: createMetricStat(
          rawStudentsCount,
          null,
          null,
          hasActiveTerm,
        ),
        teachersCount: createMetricStat(rawTeachersCount, null, null, true),
        classesCount: createMetricStat(rawClassesCount, null, null, true),
        recentStudents,
      };
    } catch (err) {
      console.error('Error fetching dashboard overview stats:', err);
      return {
        studentsCount: createMetricStat(0, null, null, false),
        teachersCount: createMetricStat(0, null, null, true),
        classesCount: createMetricStat(0, null, null, true),
        recentStudents: [],
      };
    }
  }
}
