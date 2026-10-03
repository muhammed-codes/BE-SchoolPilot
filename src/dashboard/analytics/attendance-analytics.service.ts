import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentAttendance } from '../../attendance/entities/student-attendance.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { AttendanceStatus } from '../../common/enums';
import {
  DashboardAttendanceAnalytics,
  AttendanceTrendPoint,
  LowAttendanceClassItem,
} from '../dto/dashboard-analytics.type';
import { AttendancePeriodFilter } from '../dto/dashboard-analytics.input';

@Injectable()
export class AttendanceAnalyticsService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly attendanceRepo: Repository<StudentAttendance>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
  ) {}

  private getDateRangeForFilter(filter: AttendancePeriodFilter): {
    startStr: string;
    endStr: string;
    trendDays: { label: string; dateStr: string }[];
  } {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (filter === AttendancePeriodFilter.TODAY) {
      const todayStr = formatDate(now);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        startStr: todayStr,
        endStr: todayStr,
        trendDays: [{ label: dayNames[now.getDay()], dateStr: todayStr }],
      };
    }

    if (filter === AttendancePeriodFilter.MONTH) {
      const start = new Date(todayYear, todayMonth, 1);
      const end = new Date(todayYear, todayMonth + 1, 0);
      const startStr = formatDate(start);
      const endStr = formatDate(end);

      const trendDays: { label: string; dateStr: string }[] = [];
      const daysCount = end.getDate();
      for (let d = 1; d <= daysCount; d++) {
        const cur = new Date(todayYear, todayMonth, d);
        const dayOfWeek = cur.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          // School days Mon-Fri
          trendDays.push({
            label: `${d} ${cur.toLocaleString('default', { month: 'short' })}`,
            dateStr: formatDate(cur),
          });
        }
      }

      return { startStr, endStr, trendDays };
    }

    // Default: WEEK (Monday to Friday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(todayYear, todayMonth, todayDate - diffToMonday);
    const friday = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 4,
    );

    const startStr = formatDate(monday);
    const endStr = formatDate(friday);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const trendDays: { label: string; dateStr: string }[] = [];

    for (let i = 0; i < 5; i++) {
      const cur = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + i,
      );
      trendDays.push({
        label: dayNames[i],
        dateStr: formatDate(cur),
      });
    }

    return { startStr, endStr, trendDays };
  }

  async getAttendanceAnalytics(
    schoolId: string,
    filter: AttendancePeriodFilter = AttendancePeriodFilter.WEEK,
    termId?: string,
  ): Promise<DashboardAttendanceAnalytics> {
    const { startStr, endStr, trendDays } = this.getDateRangeForFilter(filter);

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.classEntity', 'classEntity')
      .where('att.schoolId = :schoolId', { schoolId })
      .andWhere('att.date BETWEEN :startStr AND :endStr', {
        startStr,
        endStr,
      });

    if (termId) {
      qb.andWhere('att.termId = :termId', { termId });
    }

    const records = await qb.getMany();

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const excusedCount = 0;

    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) presentCount++;
      else if (r.status === AttendanceStatus.ABSENT) absentCount++;
      else if (r.status === AttendanceStatus.LATE) lateCount++;
    }

    const totalRecords = records.length;
    const overallPercentage =
      totalRecords > 0
        ? Math.min(
            100,
            Math.round(((presentCount + lateCount) / totalRecords) * 100 * 10) /
              10,
          )
        : 0;

    // Trend grouping by day
    const trend: AttendanceTrendPoint[] = trendDays.map((td) => {
      const dayRecords = records.filter((r) => r.date === td.dateStr);
      let dayPresent = 0;
      let dayAbsent = 0;
      let dayLate = 0;
      for (const r of dayRecords) {
        if (r.status === AttendanceStatus.PRESENT) dayPresent++;
        else if (r.status === AttendanceStatus.ABSENT) dayAbsent++;
        else if (r.status === AttendanceStatus.LATE) dayLate++;
      }
      const dayTotal = dayRecords.length;
      const percentage =
        dayTotal > 0
          ? Math.min(
              100,
              Math.round(((dayPresent + dayLate) / dayTotal) * 100 * 10) / 10,
            )
          : 0;

      return {
        label: td.label,
        date: td.dateStr,
        attendancePercentage: percentage,
        presentCount: dayPresent,
        absentCount: dayAbsent,
        lateCount: dayLate,
        totalCount: dayTotal,
      };
    });

    // Low attendance classes (< 85% or lowest)
    const classMap = new Map<
      string,
      { className: string; present: number; total: number }
    >();

    for (const r of records) {
      if (!r.classId) continue;
      const cName = r.classEntity?.name || 'Class';
      const existing = classMap.get(r.classId) || {
        className: cName,
        present: 0,
        total: 0,
      };
      existing.total++;
      if (
        r.status === AttendanceStatus.PRESENT ||
        r.status === AttendanceStatus.LATE
      ) {
        existing.present++;
      }
      classMap.set(r.classId, existing);
    }

    const lowAttendanceClasses: LowAttendanceClassItem[] = [];
    for (const [classId, data] of classMap.entries()) {
      const rate =
        data.total > 0
          ? Math.min(
              100,
              Math.round((data.present / data.total) * 100 * 10) / 10,
            )
          : 0;
      if (rate < 85 || data.present < data.total) {
        lowAttendanceClasses.push({
          classId,
          className: data.className,
          attendancePercentage: rate,
          presentCount: data.present,
          totalCount: data.total,
        });
      }
    }

    lowAttendanceClasses.sort(
      (a, b) => a.attendancePercentage - b.attendancePercentage,
    );

    return {
      overallPercentage,
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      trend,
      lowAttendanceClasses: lowAttendanceClasses.slice(0, 5),
    };
  }
}
