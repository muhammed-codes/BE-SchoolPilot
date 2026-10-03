import {
  ObjectType,
  Field,
  Float,
  Int,
  registerEnumType,
} from '@nestjs/graphql';

export enum AttentionSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

registerEnumType(AttentionSeverity, {
  name: 'AttentionSeverity',
  description: 'Severity level for items requiring administrative attention',
});

// 1. Term & Academic Progress
@ObjectType()
export class DashboardTermProgress {
  @Field(() => String, { nullable: true })
  sessionId!: string | null;

  @Field(() => String, { nullable: true })
  sessionName!: string | null;

  @Field(() => String, { nullable: true })
  termId!: string | null;

  @Field(() => String, { nullable: true })
  termName!: string | null;

  @Field(() => String, { nullable: true })
  startDate!: string | null;

  @Field(() => String, { nullable: true })
  endDate!: string | null;

  @Field(() => Int)
  currentWeek!: number;

  @Field(() => Int)
  totalWeeks!: number;

  @Field(() => Int)
  weeksElapsed!: number;

  @Field(() => Int)
  weeksRemaining!: number;

  @Field(() => Float)
  termProgressPercentage!: number;

  @Field(() => Int)
  schoolDaysElapsed!: number;

  @Field(() => Int)
  totalSchoolDays!: number;

  @Field(() => Float)
  schoolDayProgressPercentage!: number;
}

// 2. Overview KPIs
@ObjectType()
export class DashboardStudentKpi {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  active!: number;

  @Field(() => Float, { nullable: true })
  changePercentage!: number | null;
}

@ObjectType()
export class DashboardStaffKpi {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  active!: number;

  @Field(() => Int)
  teachingCount!: number;

  @Field(() => Int)
  nonTeachingCount!: number;

  @Field(() => Float, { nullable: true })
  changePercentage!: number | null;
}

@ObjectType()
export class DashboardGuardianKpi {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  active!: number;

  @Field(() => Int)
  studentsWithGuardian!: number;

  @Field(() => Int)
  studentsWithoutGuardian!: number;

  @Field(() => Int)
  unlinkedGuardians!: number;
}

@ObjectType()
export class DashboardAttendanceKpi {
  @Field(() => Float)
  todayPercentage!: number;

  @Field(() => Int)
  presentToday!: number;

  @Field(() => Int)
  absentToday!: number;

  @Field(() => Int)
  lateToday!: number;

  @Field(() => Int)
  totalExpectedToday!: number;
}

@ObjectType()
export class DashboardFeeKpi {
  @Field(() => Float)
  collectedAmount!: number;

  @Field(() => Float)
  previousPeriodAmount!: number;

  @Field(() => Float, { nullable: true })
  changePercentage!: number | null;
}

@ObjectType()
export class DashboardOverviewKpis {
  @Field(() => DashboardStudentKpi)
  students!: DashboardStudentKpi;

  @Field(() => DashboardStaffKpi)
  staff!: DashboardStaffKpi;

  @Field(() => Int)
  classesCount!: number;

  @Field(() => DashboardGuardianKpi)
  guardians!: DashboardGuardianKpi;

  @Field(() => DashboardAttendanceKpi)
  attendance!: DashboardAttendanceKpi;

  @Field(() => DashboardFeeKpi)
  fees!: DashboardFeeKpi;
}

// 3. Income Trend
@ObjectType()
export class IncomeTrendPoint {
  @Field(() => String)
  label!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => String, { nullable: true })
  date?: string | null;
}

@ObjectType()
export class DashboardIncomeAnalytics {
  @Field(() => Float)
  total!: number;

  @Field(() => Float)
  previousPeriodTotal!: number;

  @Field(() => Float, { nullable: true })
  changePercentage!: number | null;

  @Field(() => [IncomeTrendPoint])
  trend!: IncomeTrendPoint[];
}

// 4. Fee Collection Overview
@ObjectType()
export class DashboardFeeCollectionOverview {
  @Field(() => Float)
  expectedFees!: number;

  @Field(() => Float)
  collectedFees!: number;

  @Field(() => Float)
  outstandingFees!: number;

  @Field(() => Float)
  collectionPercentage!: number;

  @Field(() => Int)
  fullyPaidStudentsCount!: number;

  @Field(() => Int)
  partiallyPaidStudentsCount!: number;

  @Field(() => Int)
  unpaidStudentsCount!: number;
}

// 5. Student Demographics
@ObjectType()
export class StudentStatusCount {
  @Field(() => String)
  status!: string;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  percentage!: number;
}

@ObjectType()
export class DashboardStudentDemographics {
  @Field(() => Int)
  totalStudents!: number;

  @Field(() => Int)
  maleCount!: number;

  @Field(() => Int)
  femaleCount!: number;

  @Field(() => Float)
  malePercentage!: number;

  @Field(() => Float)
  femalePercentage!: number;

  @Field(() => [StudentStatusCount])
  statusDistribution!: StudentStatusCount[];
}

// 6. Class Distribution
@ObjectType()
export class DashboardClassDistributionItem {
  @Field(() => String)
  classId!: string;

  @Field(() => String)
  className!: string;

  @Field(() => Int)
  studentCount!: number;
}

// 7. Attendance Analytics
@ObjectType()
export class AttendanceTrendPoint {
  @Field(() => String)
  label!: string;

  @Field(() => String)
  date!: string;

  @Field(() => Float)
  attendancePercentage!: number;

  @Field(() => Int)
  presentCount!: number;

  @Field(() => Int)
  absentCount!: number;

  @Field(() => Int)
  lateCount!: number;

  @Field(() => Int)
  totalCount!: number;
}

@ObjectType()
export class LowAttendanceClassItem {
  @Field(() => String)
  classId!: string;

  @Field(() => String)
  className!: string;

  @Field(() => Float)
  attendancePercentage!: number;

  @Field(() => Int)
  presentCount!: number;

  @Field(() => Int)
  totalCount!: number;
}

@ObjectType()
export class DashboardAttendanceAnalytics {
  @Field(() => Float)
  overallPercentage!: number;

  @Field(() => Int)
  totalRecords!: number;

  @Field(() => Int)
  presentCount!: number;

  @Field(() => Int)
  absentCount!: number;

  @Field(() => Int)
  lateCount!: number;

  @Field(() => Int)
  excusedCount!: number;

  @Field(() => [AttendanceTrendPoint])
  trend!: AttendanceTrendPoint[];

  @Field(() => [LowAttendanceClassItem])
  lowAttendanceClasses!: LowAttendanceClassItem[];
}

// 8. Academic Performance
@ObjectType()
export class SubjectPerformanceItem {
  @Field(() => String)
  subjectId!: string;

  @Field(() => String)
  subjectName!: string;

  @Field(() => Float)
  averageScore!: number;

  @Field(() => Float)
  highestScore!: number;

  @Field(() => Float)
  lowestScore!: number;

  @Field(() => Float)
  passRate!: number;

  @Field(() => Int)
  totalStudents!: number;
}

@ObjectType()
export class ClassPerformanceItem {
  @Field(() => String)
  classId!: string;

  @Field(() => String)
  className!: string;

  @Field(() => Float)
  averageScore!: number;

  @Field(() => Float)
  passRate!: number;

  @Field(() => Int)
  totalStudents!: number;
}

@ObjectType()
export class DashboardAcademicPerformance {
  @Field(() => Float)
  overallAverageScore!: number;

  @Field(() => Float)
  overallPassRate!: number;

  @Field(() => Int)
  studentsNeedingAttentionCount!: number;

  @Field(() => [SubjectPerformanceItem])
  subjectPerformances!: SubjectPerformanceItem[];

  @Field(() => [ClassPerformanceItem])
  classPerformances!: ClassPerformanceItem[];
}

// 9. Result Submission Status
@ObjectType()
export class TeacherPendingSubmissionItem {
  @Field(() => String)
  teacherId!: string;

  @Field(() => String)
  teacherName!: string;

  @Field(() => Int)
  pendingCount!: number;

  @Field(() => [String])
  classNames!: string[];

  @Field(() => [String])
  subjectNames!: string[];
}

@ObjectType()
export class DashboardResultSubmissionStatus {
  @Field(() => Int)
  totalExpectedSheets!: number;

  @Field(() => Int)
  submittedSheets!: number;

  @Field(() => Int)
  pendingSheets!: number;

  @Field(() => Float)
  completionPercentage!: number;

  @Field(() => [TeacherPendingSubmissionItem])
  teachersWithPendingSubmissions!: TeacherPendingSubmissionItem[];
}

// 10. Guardian Overview
@ObjectType()
export class DashboardGuardianOverview {
  @Field(() => Int)
  totalGuardians!: number;

  @Field(() => Int)
  activeGuardians!: number;

  @Field(() => Int)
  studentsWithGuardian!: number;

  @Field(() => Int)
  studentsWithoutGuardian!: number;

  @Field(() => Float)
  guardianCoveragePercentage!: number;

  @Field(() => Int)
  unlinkedGuardians!: number;
}

// 11. Staff Overview
@ObjectType()
export class StaffTodayAttendanceSummary {
  @Field(() => Int)
  presentCount!: number;

  @Field(() => Int)
  absentCount!: number;

  @Field(() => Int)
  lateCount!: number;

  @Field(() => Float)
  attendancePercentage!: number;
}

@ObjectType()
export class DashboardStaffOverview {
  @Field(() => Int)
  totalStaff!: number;

  @Field(() => Int)
  teachingStaff!: number;

  @Field(() => Int)
  nonTeachingStaff!: number;

  @Field(() => Int)
  activeStaff!: number;

  @Field(() => Int)
  inactiveStaff!: number;

  @Field(() => StaffTodayAttendanceSummary)
  todayAttendance!: StaffTodayAttendanceSummary;
}

// 12. Needs Attention
@ObjectType()
export class DashboardNeedsAttentionItem {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  type!: string;

  @Field(() => Int)
  count!: number;

  @Field(() => AttentionSeverity)
  severity!: AttentionSeverity;

  @Field(() => String)
  label!: string;

  @Field(() => String)
  actionLabel!: string;

  @Field(() => String)
  actionRoute!: string;
}

// Root Dashboard Analytics Type
@ObjectType()
export class DashboardAnalytics {
  @Field(() => DashboardTermProgress)
  termProgress!: DashboardTermProgress;

  @Field(() => DashboardOverviewKpis)
  kpis!: DashboardOverviewKpis;

  @Field(() => DashboardIncomeAnalytics)
  incomeAnalytics!: DashboardIncomeAnalytics;

  @Field(() => DashboardFeeCollectionOverview)
  feeCollectionOverview!: DashboardFeeCollectionOverview;

  @Field(() => DashboardStudentDemographics)
  studentDemographics!: DashboardStudentDemographics;

  @Field(() => [DashboardClassDistributionItem])
  classDistribution!: DashboardClassDistributionItem[];

  @Field(() => DashboardAttendanceAnalytics)
  attendanceAnalytics!: DashboardAttendanceAnalytics;

  @Field(() => DashboardAcademicPerformance)
  academicPerformance!: DashboardAcademicPerformance;

  @Field(() => DashboardResultSubmissionStatus)
  resultSubmissionStatus!: DashboardResultSubmissionStatus;

  @Field(() => DashboardGuardianOverview)
  guardianOverview!: DashboardGuardianOverview;

  @Field(() => DashboardStaffOverview)
  staffOverview!: DashboardStaffOverview;

  @Field(() => [DashboardNeedsAttentionItem])
  needsAttention!: DashboardNeedsAttentionItem[];
}
