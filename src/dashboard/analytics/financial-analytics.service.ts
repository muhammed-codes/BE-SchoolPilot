import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSubmissionStudentShare, PaymentShareStatus } from '../../fees/entities/payment-submission-student-share.entity';
import { StudentInvoice, InvoiceStatus } from '../../fees/entities/student-invoice.entity';
import { Term } from '../../terms/entities/term.entity';
import { TermStatus } from '../../common/enums';
import {
  DashboardIncomeAnalytics,
  DashboardFeeCollectionOverview,
  IncomeTrendPoint,
} from '../dto/dashboard-analytics.type';
import { DashboardTimeFilter } from '../dto/dashboard-analytics.input';

@Injectable()
export class FinancialAnalyticsService {
  constructor(
    @InjectRepository(PaymentSubmissionStudentShare)
    private readonly shareRepo: Repository<PaymentSubmissionStudentShare>,
    @InjectRepository(StudentInvoice)
    private readonly invoiceRepo: Repository<StudentInvoice>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
  ) {}

  private getUtcDateRangeForFilter(
    filter: DashboardTimeFilter,
    activeTerm?: Term | null,
  ): {
    currentStart: Date;
    currentEnd: Date;
    prevStart: Date;
    prevEnd: Date;
    trendLabels: { label: string; start: Date; end: Date }[];
  } {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    if (filter === DashboardTimeFilter.TODAY) {
      const currentStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
      const currentEnd = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
      const prevStart = new Date(todayYear, todayMonth, todayDate - 1, 0, 0, 0, 0);
      const prevEnd = new Date(todayYear, todayMonth, todayDate - 1, 23, 59, 59, 999);

      const trendLabels: { label: string; start: Date; end: Date }[] = [];
      const intervals = [
        { label: '08:00', startH: 6, endH: 8 },
        { label: '10:00', startH: 8, endH: 10 },
        { label: '12:00', startH: 10, endH: 12 },
        { label: '14:00', startH: 12, endH: 14 },
        { label: '16:00', startH: 14, endH: 16 },
        { label: '18:00', startH: 16, endH: 18 },
        { label: 'Evening', startH: 18, endH: 24 },
      ];

      for (const interval of intervals) {
        trendLabels.push({
          label: interval.label,
          start: new Date(todayYear, todayMonth, todayDate, interval.startH, 0, 0, 0),
          end: new Date(
            todayYear,
            todayMonth,
            todayDate,
            interval.endH === 24 ? 23 : interval.endH,
            interval.endH === 24 ? 59 : 0,
            interval.endH === 24 ? 59 : 0,
          ),
        });
      }

      return { currentStart, currentEnd, prevStart, prevEnd, trendLabels };
    }

    if (filter === DashboardTimeFilter.WEEK) {
      const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
      const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
      const monday = new Date(todayYear, todayMonth, todayDate - diffToMonday, 0, 0, 0, 0);
      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
        23,
        59,
        59,
        999,
      );

      const prevMonday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() - 7,
        0,
        0,
        0,
        0,
      );
      const prevSunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() - 1,
        23,
        59,
        59,
        999,
      );

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const trendLabels: { label: string; start: Date; end: Date }[] = [];

      for (let i = 0; i < 7; i++) {
        const dStart = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + i,
          0,
          0,
          0,
          0,
        );
        const dEnd = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + i,
          23,
          59,
          59,
          999,
        );
        trendLabels.push({
          label: dayNames[i],
          start: dStart,
          end: dEnd,
        });
      }

      return {
        currentStart: monday,
        currentEnd: sunday,
        prevStart: prevMonday,
        prevEnd: prevSunday,
        trendLabels,
      };
    }

    if (filter === DashboardTimeFilter.TERM && activeTerm?.startDate && activeTerm?.endDate) {
      const currentStart = new Date(activeTerm.startDate);
      currentStart.setHours(0, 0, 0, 0);
      const currentEnd = new Date(activeTerm.endDate);
      currentEnd.setHours(23, 59, 59, 999);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      const prevEnd = new Date(currentStart.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);

      const totalWeeks = Math.max(1, activeTerm.totalWeeks || 12);
      const trendLabels: { label: string; start: Date; end: Date }[] = [];

      for (let w = 0; w < totalWeeks; w++) {
        const wStart = new Date(
          currentStart.getFullYear(),
          currentStart.getMonth(),
          currentStart.getDate() + w * 7,
          0,
          0,
          0,
          0,
        );
        const wEnd = new Date(
          currentStart.getFullYear(),
          currentStart.getMonth(),
          currentStart.getDate() + (w + 1) * 7 - 1,
          23,
          59,
          59,
          999,
        );
        trendLabels.push({
          label: `Wk ${w + 1}`,
          start: wStart,
          end: wEnd,
        });
      }

      return { currentStart, currentEnd, prevStart, prevEnd, trendLabels };
    }

    if (filter === DashboardTimeFilter.YEAR) {
      const currentStart = new Date(todayYear, 0, 1, 0, 0, 0, 0);
      const currentEnd = new Date(todayYear, 11, 31, 23, 59, 59, 999);
      const prevStart = new Date(todayYear - 1, 0, 1, 0, 0, 0, 0);
      const prevEnd = new Date(todayYear - 1, 11, 31, 23, 59, 59, 999);

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const trendLabels: { label: string; start: Date; end: Date }[] = [];

      for (let m = 0; m < 12; m++) {
        const mStart = new Date(todayYear, m, 1, 0, 0, 0, 0);
        const mEnd = new Date(todayYear, m + 1, 0, 23, 59, 59, 999);
        trendLabels.push({
          label: monthNames[m],
          start: mStart,
          end: mEnd,
        });
      }

      return { currentStart, currentEnd, prevStart, prevEnd, trendLabels };
    }

    // Default: MONTH
    const currentStart = new Date(todayYear, todayMonth, 1, 0, 0, 0, 0);
    const currentEnd = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(todayYear, todayMonth - 1, 1, 0, 0, 0, 0);
    const prevEnd = new Date(todayYear, todayMonth, 0, 23, 59, 59, 999);

    const trendLabels: { label: string; start: Date; end: Date }[] = [];
    const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
    const numBuckets = 4;
    const daysPerBucket = Math.ceil(daysInMonth / numBuckets);

    for (let b = 0; b < numBuckets; b++) {
      const startDay = b * daysPerBucket + 1;
      const endDay = Math.min(daysInMonth, (b + 1) * daysPerBucket);
      const bStart = new Date(todayYear, todayMonth, startDay, 0, 0, 0, 0);
      const bEnd = new Date(todayYear, todayMonth, endDay, 23, 59, 59, 999);
      trendLabels.push({
        label: `Wk ${b + 1}`,
        start: bStart,
        end: bEnd,
      });
    }

    return { currentStart, currentEnd, prevStart, prevEnd, trendLabels };
  }

  async getIncomeAnalytics(
    schoolId: string,
    filter: DashboardTimeFilter = DashboardTimeFilter.MONTH,
    termId?: string,
  ): Promise<DashboardIncomeAnalytics> {
    const activeTerm = termId
      ? await this.termRepo.findOne({ where: { id: termId, schoolId } })
      : await this.termRepo.findOne({
          where: { schoolId, status: TermStatus.ACTIVE },
        });

    const { currentStart, currentEnd, prevStart, prevEnd, trendLabels } =
      this.getUtcDateRangeForFilter(filter, activeTerm);

    // Query approved payments in current period
    const currentShares = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.batch', 'batch')
      .where('batch.schoolId = :schoolId', { schoolId })
      .andWhere('share.status = :status', { status: PaymentShareStatus.APPROVED })
      .andWhere(
        'COALESCE(share.finalizedAt, share.createdAt) BETWEEN :start AND :end',
        {
          start: currentStart,
          end: currentEnd,
        },
      )
      .select(['share.id', 'share.amount', 'share.finalizedAt', 'share.createdAt'])
      .getMany();

    // Query approved payments in previous comparable period
    const prevShares = await this.shareRepo
      .createQueryBuilder('share')
      .innerJoin('share.batch', 'batch')
      .where('batch.schoolId = :schoolId', { schoolId })
      .andWhere('share.status = :status', { status: PaymentShareStatus.APPROVED })
      .andWhere(
        'COALESCE(share.finalizedAt, share.createdAt) BETWEEN :start AND :end',
        {
          start: prevStart,
          end: prevEnd,
        },
      )
      .select(['share.id', 'share.amount'])
      .getMany();

    const total = currentShares.reduce((sum, s) => sum + (s.amount || 0), 0);
    const previousPeriodTotal = prevShares.reduce(
      (sum, s) => sum + (s.amount || 0),
      0,
    );

    let changePercentage: number | null = null;
    if (previousPeriodTotal > 0) {
      const diff = total - previousPeriodTotal;
      changePercentage = Math.round((diff / previousPeriodTotal) * 100 * 10) / 10;
    } else if (total > 0) {
      changePercentage = 100.0;
    } else {
      changePercentage = 0.0;
    }

    // Build trend data points
    const trend: IncomeTrendPoint[] = trendLabels.map((bucket) => {
      const bucketShares = currentShares.filter((s) => {
        const date = new Date(s.finalizedAt || s.createdAt);
        return date >= bucket.start && date <= bucket.end;
      });
      const amount = bucketShares.reduce((sum, s) => sum + (s.amount || 0), 0);
      return {
        label: bucket.label,
        amount,
        date: bucket.start.toISOString().slice(0, 10),
      };
    });

    return {
      total,
      previousPeriodTotal,
      changePercentage,
      trend,
    };
  }

  async getFeeCollectionOverview(
    schoolId: string,
    termId?: string,
    sessionId?: string,
  ): Promise<DashboardFeeCollectionOverview> {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.schoolId = :schoolId', { schoolId });

    if (termId) {
      qb.andWhere('invoice.termId = :termId', { termId });
    } else if (sessionId) {
      qb.andWhere('invoice.sessionId = :sessionId', { sessionId });
    } else {
      // Filter by active term if available
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      if (activeTerm) {
        qb.andWhere('invoice.termId = :termId', { termId: activeTerm.id });
      }
    }

    const invoices = await qb.getMany();

    let expectedFees = 0;
    let collectedFees = 0;
    let outstandingFees = 0;
    let fullyPaidStudentsCount = 0;
    let partiallyPaidStudentsCount = 0;
    let unpaidStudentsCount = 0;

    for (const inv of invoices) {
      expectedFees += inv.totalAmount || 0;
      collectedFees += inv.totalPaid || 0;
      outstandingFees += inv.balance || 0;

      if (inv.status === InvoiceStatus.PAID) {
        fullyPaidStudentsCount++;
      } else if (inv.status === InvoiceStatus.PARTIALLY_PAID) {
        partiallyPaidStudentsCount++;
      } else {
        unpaidStudentsCount++;
      }
    }

    const collectionPercentage =
      expectedFees > 0
        ? Math.min(
            100,
            Math.round((collectedFees / expectedFees) * 100 * 10) / 10,
          )
        : 0;

    return {
      expectedFees,
      collectedFees,
      outstandingFees,
      collectionPercentage,
      fullyPaidStudentsCount,
      partiallyPaidStudentsCount,
      unpaidStudentsCount,
    };
  }
}
