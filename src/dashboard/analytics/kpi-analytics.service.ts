import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { StudentAttendance } from '../../attendance/entities/student-attendance.entity';
import {
  PaymentSubmissionStudentShare,
  PaymentShareStatus,
} from '../../fees/entities/payment-submission-student-share.entity';
import { Gender, StudentStatus, AttendanceStatus } from '../../common/enums';
import {
  SCHOOL_STAFF_ROLES,
  TEACHER_ROLES,
} from '../../common/constants/roles.constant';
import {
  DashboardOverviewKpis,
  DashboardStudentDemographics,
  DashboardClassDistributionItem,
  StudentStatusCount,
} from '../dto/dashboard-analytics.type';
import { GuardianAnalyticsService } from './guardian-analytics.service';

@Injectable()
export class KpiAnalyticsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(StudentAttendance)
    private readonly attendanceRepo: Repository<StudentAttendance>,
    @InjectRepository(PaymentSubmissionStudentShare)
    private readonly shareRepo: Repository<PaymentSubmissionStudentShare>,
    private readonly guardianAnalyticsService: GuardianAnalyticsService,
  ) {}

  async getOverviewKpis(schoolId: string): Promise<DashboardOverviewKpis> {
    // 1. Students KPI
    const totalStudents = await this.studentRepo.count({
      where: { schoolId },
    });
    const activeStudents = await this.studentRepo.count({
      where: { schoolId, isArchived: false, status: StudentStatus.ACTIVE },
    });

    // 2. Staff KPI
    const allStaff = await this.userRepo.find({
      where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
    });
    const totalStaff = allStaff.length;
    const activeStaff = allStaff.filter((s) => s.isActive).length;
    const teachingCount = allStaff.filter((s) =>
      TEACHER_ROLES.includes(s.role),
    ).length;
    const nonTeachingCount = totalStaff - teachingCount;

    // 3. Classes Count
    const classesCount = await this.classRepo.count({
      where: { schoolId },
    });

    // 4. Guardians KPI
    const guardianOverview =
      await this.guardianAnalyticsService.getGuardianOverview(schoolId);

    // 5. Today's Attendance KPI
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const attendanceToday = await this.attendanceRepo.find({
      where: { schoolId, date: todayStr },
    });

    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    for (const record of attendanceToday) {
      if (record.status === AttendanceStatus.PRESENT) presentToday++;
      else if (record.status === AttendanceStatus.ABSENT) absentToday++;
      else if (record.status === AttendanceStatus.LATE) lateToday++;
    }

    const totalAttendanceToday = attendanceToday.length;
    const todayPercentage =
      totalAttendanceToday > 0
        ? Math.min(
            100,
            Math.round(
              ((presentToday + lateToday) / totalAttendanceToday) * 100 * 10,
            ) / 10,
          )
        : 0;

    // 6. Fees KPI (Collected in last 30 days vs prior 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentFeeShares = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.batch', 'batch')
      .where('batch.schoolId = :schoolId', { schoolId })
      .andWhere('share.status = :status', {
        status: PaymentShareStatus.APPROVED,
      })
      .andWhere(
        'COALESCE(share.finalizedAt, share.createdAt) BETWEEN :start AND :end',
        {
          start: thirtyDaysAgo,
          end: now,
        },
      )
      .select(['share.id', 'share.amount'])
      .getMany();

    const priorFeeShares = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.batch', 'batch')
      .where('batch.schoolId = :schoolId', { schoolId })
      .andWhere('share.status = :status', {
        status: PaymentShareStatus.APPROVED,
      })
      .andWhere(
        'COALESCE(share.finalizedAt, share.createdAt) BETWEEN :start AND :end',
        {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        },
      )
      .select(['share.id', 'share.amount'])
      .getMany();

    const collectedAmount = currentFeeShares.reduce(
      (sum, s) => sum + (s.amount || 0),
      0,
    );
    const previousPeriodAmount = priorFeeShares.reduce(
      (sum, s) => sum + (s.amount || 0),
      0,
    );

    let feeChangePercentage: number | null = null;
    if (previousPeriodAmount > 0) {
      feeChangePercentage =
        Math.round(
          ((collectedAmount - previousPeriodAmount) / previousPeriodAmount) *
            100 *
            10,
        ) / 10;
    } else if (collectedAmount > 0) {
      feeChangePercentage = 100.0;
    } else {
      feeChangePercentage = 0.0;
    }

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
        changePercentage: null,
      },
      staff: {
        total: totalStaff,
        active: activeStaff,
        teachingCount,
        nonTeachingCount,
        changePercentage: null,
      },
      classesCount,
      guardians: {
        total: guardianOverview.totalGuardians,
        active: guardianOverview.activeGuardians,
        studentsWithGuardian: guardianOverview.studentsWithGuardian,
        studentsWithoutGuardian: guardianOverview.studentsWithoutGuardian,
        unlinkedGuardians: guardianOverview.unlinkedGuardians,
      },
      attendance: {
        todayPercentage,
        presentToday,
        absentToday,
        lateToday,
        totalExpectedToday: activeStudents,
      },
      fees: {
        collectedAmount,
        previousPeriodAmount,
        changePercentage: feeChangePercentage,
      },
    };
  }

  async getStudentDemographics(
    schoolId: string,
  ): Promise<DashboardStudentDemographics> {
    const students = await this.studentRepo.find({
      where: { schoolId, isArchived: false },
    });

    const totalStudents = students.length;
    let maleCount = 0;
    let femaleCount = 0;

    const statusMap = new Map<string, number>();

    for (const student of students) {
      if (student.gender === Gender.MALE) {
        maleCount++;
      } else if (student.gender === Gender.FEMALE) {
        femaleCount++;
      }

      const status = student.status || StudentStatus.ACTIVE;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }

    const malePercentage =
      totalStudents > 0
        ? Math.min(100, Math.round((maleCount / totalStudents) * 100 * 10) / 10)
        : 0;

    const femalePercentage =
      totalStudents > 0
        ? Math.min(
            100,
            Math.round((femaleCount / totalStudents) * 100 * 10) / 10,
          )
        : 0;

    const statusDistribution: StudentStatusCount[] = [];
    for (const [status, count] of statusMap.entries()) {
      const percentage =
        totalStudents > 0
          ? Math.min(100, Math.round((count / totalStudents) * 100 * 10) / 10)
          : 0;
      statusDistribution.push({
        status,
        count,
        percentage,
      });
    }

    return {
      totalStudents,
      maleCount,
      femaleCount,
      malePercentage,
      femalePercentage,
      statusDistribution,
    };
  }

  async getClassDistribution(
    schoolId: string,
  ): Promise<DashboardClassDistributionItem[]> {
    const classes = await this.classRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });

    const classCountsRaw = await this.studentRepo
      .createQueryBuilder('student')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isArchived = false')
      .andWhere('student.currentClassId IS NOT NULL')
      .select('student.currentClassId', 'classId')
      .addSelect('COUNT(student.id)', 'count')
      .groupBy('student.currentClassId')
      .getRawMany();

    const countMap = new Map<string, number>();
    for (const row of classCountsRaw) {
      countMap.set(row.classId, parseInt(row.count || '0', 10));
    }

    const distribution: DashboardClassDistributionItem[] = classes.map(
      (cls) => ({
        classId: cls.id,
        className: cls.name,
        studentCount: countMap.get(cls.id) || 0,
      }),
    );

    return distribution;
  }
}
