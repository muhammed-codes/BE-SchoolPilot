import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StaffAttendance } from '../../attendance/entities/staff-attendance.entity';
import {
  SCHOOL_STAFF_ROLES,
  TEACHER_ROLES,
} from '../../common/constants/roles.constant';
import {
  DashboardStaffOverview,
  StaffTodayAttendanceSummary,
} from '../dto/dashboard-analytics.type';

@Injectable()
export class StaffAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StaffAttendance)
    private readonly staffAttendanceRepo: Repository<StaffAttendance>,
  ) {}

  async getStaffOverview(schoolId: string): Promise<DashboardStaffOverview> {
    const allStaff = await this.userRepo.find({
      where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
    });

    const totalStaff = allStaff.length;
    let teachingStaff = 0;
    let nonTeachingStaff = 0;
    let activeStaff = 0;
    let inactiveStaff = 0;

    for (const member of allStaff) {
      if (TEACHER_ROLES.includes(member.role)) {
        teachingStaff++;
      } else {
        nonTeachingStaff++;
      }

      if (member.isActive) {
        activeStaff++;
      } else {
        inactiveStaff++;
      }
    }

    // Today's staff attendance
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const staffAttendanceToday = await this.staffAttendanceRepo.find({
      where: { schoolId, date: todayStr },
    });

    let presentCount = 0;
    let lateCount = 0;

    for (const record of staffAttendanceToday) {
      if (record.clockInTime) {
        if (record.isLate) {
          lateCount++;
        } else {
          presentCount++;
        }
      }
    }

    const absentCount = Math.max(0, activeStaff - (presentCount + lateCount));
    const attendancePercentage =
      activeStaff > 0
        ? Math.min(
            100,
            Math.round(
              ((presentCount + lateCount) / activeStaff) * 100 * 10,
            ) / 10,
          )
        : 0;

    const todayAttendance: StaffTodayAttendanceSummary = {
      presentCount,
      absentCount,
      lateCount,
      attendancePercentage,
    };

    return {
      totalStaff,
      teachingStaff,
      nonTeachingStaff,
      activeStaff,
      inactiveStaff,
      todayAttendance,
    };
  }
}
