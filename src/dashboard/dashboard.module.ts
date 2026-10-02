import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Term } from '../terms/entities/term.entity';
import { Session } from '../terms/entities/session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { StaffAttendance } from '../attendance/entities/staff-attendance.entity';
import { ResultSheet } from '../results/entities/result-sheet.entity';
import { StudentResult } from '../results/entities/student-result.entity';
import { SubjectScore } from '../results/entities/subject-score.entity';
import { StudentInvoice } from '../fees/entities/student-invoice.entity';
import { PaymentSubmissionStudentShare } from '../fees/entities/payment-submission-student-share.entity';

import { ClassesModule } from '../classes/classes.module';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

import { TermAnalyticsService } from './analytics/term-analytics.service';
import { KpiAnalyticsService } from './analytics/kpi-analytics.service';
import { FinancialAnalyticsService } from './analytics/financial-analytics.service';
import { AttendanceAnalyticsService } from './analytics/attendance-analytics.service';
import { AcademicAnalyticsService } from './analytics/academic-analytics.service';
import { ResultSubmissionAnalyticsService } from './analytics/result-submission-analytics.service';
import { GuardianAnalyticsService } from './analytics/guardian-analytics.service';
import { StaffAnalyticsService } from './analytics/staff-analytics.service';
import { NeedsAttentionAnalyticsService } from './analytics/needs-attention-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      StudentParent,
      User,
      ClassEntity,
      ClassSubject,
      Term,
      Session,
      StudentAttendance,
      StaffAttendance,
      ResultSheet,
      StudentResult,
      SubjectScore,
      StudentInvoice,
      PaymentSubmissionStudentShare,
    ]),
    ClassesModule,
  ],
  providers: [
    DashboardService,
    DashboardResolver,
    TermAnalyticsService,
    KpiAnalyticsService,
    FinancialAnalyticsService,
    AttendanceAnalyticsService,
    AcademicAnalyticsService,
    ResultSubmissionAnalyticsService,
    GuardianAnalyticsService,
    StaffAnalyticsService,
    NeedsAttentionAnalyticsService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
