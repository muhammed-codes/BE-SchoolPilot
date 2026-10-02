import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { TermAnalyticsService } from './analytics/term-analytics.service';
import { KpiAnalyticsService } from './analytics/kpi-analytics.service';
import { FinancialAnalyticsService } from './analytics/financial-analytics.service';
import { AttendanceAnalyticsService } from './analytics/attendance-analytics.service';
import { AcademicAnalyticsService } from './analytics/academic-analytics.service';
import { ResultSubmissionAnalyticsService } from './analytics/result-submission-analytics.service';
import { GuardianAnalyticsService } from './analytics/guardian-analytics.service';
import { StaffAnalyticsService } from './analytics/staff-analytics.service';
import { NeedsAttentionAnalyticsService } from './analytics/needs-attention-analytics.service';
import { ClassesService } from '../classes/classes.service';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Term } from '../terms/entities/term.entity';
import { Session } from '../terms/entities/session.entity';
import { DashboardTimeFilter, AttendancePeriodFilter } from './dto/dashboard-analytics.input';
import { AttentionSeverity } from './dto/dashboard-analytics.type';

describe('DashboardService & Analytics Services', () => {
  let dashboardService: DashboardService;
  let termAnalyticsService: TermAnalyticsService;
  let financialAnalyticsService: FinancialAnalyticsService;
  let attendanceAnalyticsService: AttendanceAnalyticsService;
  let academicAnalyticsService: AcademicAnalyticsService;
  let needsAttentionAnalyticsService: NeedsAttentionAnalyticsService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockClassesService = {
    getClassesForTeacher: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: TermAnalyticsService,
          useValue: {
            getTermProgress: jest.fn().mockResolvedValue({
              sessionId: 's-1',
              sessionName: '2026/2027',
              termId: 't-1',
              termName: 'First Term',
              startDate: '2026-09-01',
              endDate: '2026-12-15',
              currentWeek: 7,
              totalWeeks: 13,
              weeksElapsed: 7,
              weeksRemaining: 6,
              termProgressPercentage: 53.8,
              schoolDaysElapsed: 35,
              totalSchoolDays: 65,
              schoolDayProgressPercentage: 53.8,
            }),
          },
        },
        {
          provide: KpiAnalyticsService,
          useValue: {
            getOverviewKpis: jest.fn().mockResolvedValue({
              students: { total: 450, active: 440, changePercentage: null },
              staff: {
                total: 35,
                active: 33,
                teachingCount: 28,
                nonTeachingCount: 7,
                changePercentage: null,
              },
              classesCount: 14,
              guardians: {
                total: 380,
                active: 375,
                studentsWithGuardian: 420,
                studentsWithoutGuardian: 20,
                unlinkedGuardians: 5,
              },
              attendance: {
                todayPercentage: 92.5,
                presentToday: 407,
                absentToday: 20,
                lateToday: 13,
                totalExpectedToday: 440,
              },
              fees: {
                collectedAmount: 18500000,
                previousPeriodAmount: 15000000,
                changePercentage: 23.3,
              },
            }),
            getStudentDemographics: jest.fn().mockResolvedValue({
              totalStudents: 440,
              maleCount: 220,
              femaleCount: 220,
              malePercentage: 50,
              femalePercentage: 50,
              statusDistribution: [
                { status: 'ACTIVE', count: 440, percentage: 100 },
              ],
            }),
            getClassDistribution: jest.fn().mockResolvedValue([
              { classId: 'c-1', className: 'JSS 1A', studentCount: 32 },
              { classId: 'c-2', className: 'JSS 1B', studentCount: 30 },
            ]),
          },
        },
        {
          provide: FinancialAnalyticsService,
          useValue: {
            getIncomeAnalytics: jest.fn().mockResolvedValue({
              total: 3730000,
              previousPeriodTotal: 3320000,
              changePercentage: 12.3,
              trend: [
                { label: 'Wk 1', amount: 950000, date: '2026-10-01' },
                { label: 'Wk 2', amount: 1200000, date: '2026-10-08' },
              ],
            }),
            getFeeCollectionOverview: jest.fn().mockResolvedValue({
              expectedFees: 25000000,
              collectedFees: 19800000,
              outstandingFees: 5200000,
              collectionPercentage: 79.2,
              fullyPaidStudentsCount: 320,
              partiallyPaidStudentsCount: 80,
              unpaidStudentsCount: 40,
            }),
          },
        },
        {
          provide: AttendanceAnalyticsService,
          useValue: {
            getAttendanceAnalytics: jest.fn().mockResolvedValue({
              overallPercentage: 91.4,
              totalRecords: 2200,
              presentCount: 1950,
              absentCount: 150,
              lateCount: 100,
              excusedCount: 0,
              trend: [
                {
                  label: 'Mon',
                  date: '2026-09-28',
                  attendancePercentage: 94,
                  presentCount: 410,
                  absentCount: 20,
                  lateCount: 10,
                  totalCount: 440,
                },
              ],
              lowAttendanceClasses: [
                {
                  classId: 'c-3',
                  className: 'SS 2B',
                  attendancePercentage: 81.5,
                  presentCount: 25,
                  totalCount: 32,
                },
              ],
            }),
          },
        },
        {
          provide: AcademicAnalyticsService,
          useValue: {
            getAcademicPerformance: jest.fn().mockResolvedValue({
              overallAverageScore: 74.2,
              overallPassRate: 88.5,
              studentsNeedingAttentionCount: 18,
              subjectPerformances: [
                {
                  subjectId: 's-1',
                  subjectName: 'Mathematics',
                  averageScore: 71.5,
                  highestScore: 98,
                  lowestScore: 24,
                  passRate: 85.0,
                  totalStudents: 120,
                },
              ],
              classPerformances: [
                {
                  classId: 'c-1',
                  className: 'JSS 1A',
                  averageScore: 76.4,
                  passRate: 91.2,
                  totalStudents: 32,
                },
              ],
            }),
          },
        },
        {
          provide: ResultSubmissionAnalyticsService,
          useValue: {
            getResultSubmissionStatus: jest.fn().mockResolvedValue({
              totalExpectedSheets: 48,
              submittedSheets: 37,
              pendingSheets: 11,
              completionPercentage: 77.1,
              teachersWithPendingSubmissions: [
                {
                  teacherId: 't-1',
                  teacherName: 'John Doe',
                  pendingCount: 2,
                  classNames: ['JSS 1A'],
                  subjectNames: ['Basic Tech'],
                },
              ],
            }),
          },
        },
        {
          provide: GuardianAnalyticsService,
          useValue: {
            getGuardianOverview: jest.fn().mockResolvedValue({
              totalGuardians: 380,
              activeGuardians: 375,
              studentsWithGuardian: 420,
              studentsWithoutGuardian: 20,
              guardianCoveragePercentage: 95.5,
              unlinkedGuardians: 5,
            }),
          },
        },
        {
          provide: StaffAnalyticsService,
          useValue: {
            getStaffOverview: jest.fn().mockResolvedValue({
              totalStaff: 35,
              teachingStaff: 28,
              nonTeachingStaff: 7,
              activeStaff: 33,
              inactiveStaff: 2,
              todayAttendance: {
                presentCount: 30,
                absentCount: 2,
                lateCount: 1,
                attendancePercentage: 93.9,
              },
            }),
          },
        },
        {
          provide: NeedsAttentionAnalyticsService,
          useValue: {
            getNeedsAttentionItems: jest.fn().mockResolvedValue([
              {
                id: 'outstanding-fees',
                type: 'OUTSTANDING_FEES',
                count: 40,
                severity: AttentionSeverity.CRITICAL,
                label: '40 students have outstanding fees for this term',
                actionLabel: 'View fee ledger',
                actionRoute: '/fees',
              },
            ]),
          },
        },
        { provide: getRepositoryToken(Student), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(ClassEntity), useValue: mockRepo },
        { provide: getRepositoryToken(Term), useValue: mockRepo },
        { provide: getRepositoryToken(Session), useValue: mockRepo },
        { provide: ClassesService, useValue: mockClassesService },
      ],
    }).compile();

    dashboardService = module.get<DashboardService>(DashboardService);
    termAnalyticsService = module.get<TermAnalyticsService>(TermAnalyticsService);
    financialAnalyticsService = module.get<FinancialAnalyticsService>(
      FinancialAnalyticsService,
    );
    attendanceAnalyticsService = module.get<AttendanceAnalyticsService>(
      AttendanceAnalyticsService,
    );
    academicAnalyticsService = module.get<AcademicAnalyticsService>(
      AcademicAnalyticsService,
    );
    needsAttentionAnalyticsService = module.get<NeedsAttentionAnalyticsService>(
      NeedsAttentionAnalyticsService,
    );
  });

  it('should compile and return full dashboard analytics', async () => {
    const result = await dashboardService.getDashboardAnalytics('school-123', {
      incomeTimeFilter: DashboardTimeFilter.MONTH,
      attendanceTimeFilter: AttendancePeriodFilter.WEEK,
    });

    expect(result).toBeDefined();
    expect(result.termProgress.termName).toBe('First Term');
    expect(result.termProgress.termProgressPercentage).toBe(53.8);
    expect(result.kpis.students.active).toBe(440);
    expect(result.incomeAnalytics.total).toBe(3730000);
    expect(result.feeCollectionOverview.collectionPercentage).toBe(79.2);
    expect(result.attendanceAnalytics.overallPercentage).toBe(91.4);
    expect(result.academicPerformance.overallAverageScore).toBe(74.2);
    expect(result.resultSubmissionStatus.completionPercentage).toBe(77.1);
    expect(result.guardianOverview.guardianCoveragePercentage).toBe(95.5);
    expect(result.staffOverview.teachingStaff).toBe(28);
    expect(result.needsAttention).toHaveLength(1);
    expect(result.needsAttention[0].severity).toBe(AttentionSeverity.CRITICAL);
  });
});
