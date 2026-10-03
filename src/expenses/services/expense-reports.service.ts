import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Expense,
  ExpenseRequest,
  ExpenseBudget,
  ExpenseCategory,
  RecurringExpense,
} from '../entities';
import {
  ExpenseSummary,
  NeedsAttentionItem,
  ExpenseBreakdownItem,
  ExpenseMonthlyTrend,
} from '../dto';
import {
  ExpensePaymentStatus,
  ExpenseRequestStatus,
  ExpenseRequestType,
} from '../enums';
import { ExpenseBudgetsService } from './expense-budgets.service';

@Injectable()
export class ExpenseReportsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseRequest)
    private readonly requestRepo: Repository<ExpenseRequest>,
    @InjectRepository(ExpenseBudget)
    private readonly budgetRepo: Repository<ExpenseBudget>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    @InjectRepository(RecurringExpense)
    private readonly recurringRepo: Repository<RecurringExpense>,
    private readonly budgetsService: ExpenseBudgetsService,
  ) {}

  getSummary = async (
    schoolId: string,
    sessionId?: string,
    termId?: string,
  ): Promise<ExpenseSummary> => {
    // 1. Total Spent
    const spentQb = this.expenseRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false');

    if (sessionId) spentQb.andWhere('e.sessionId = :sessionId', { sessionId });
    if (termId) spentQb.andWhere('e.termId = :termId', { termId });

    const spentRaw = await spentQb.getRawOne<{ total: string | null }>();
    const totalSpent = parseFloat(spentRaw?.total || '0');

    // 2. Pending Requests
    const pendingReqQb = this.requestRepo
      .createQueryBuilder('r')
      .select('COUNT(r.id)', 'count')
      .addSelect('SUM(r.estimatedAmount)', 'total')
      .where('r.schoolId = :schoolId', { schoolId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [
          ExpenseRequestStatus.SUBMITTED,
          ExpenseRequestStatus.PENDING_APPROVAL,
        ],
      });

    if (sessionId)
      pendingReqQb.andWhere('r.sessionId = :sessionId', { sessionId });
    if (termId) pendingReqQb.andWhere('r.termId = :termId', { termId });

    const pendingRaw = await pendingReqQb.getRawOne<{
      count: string | null;
      total: string | null;
    }>();
    const pendingRequestsCount = parseInt(pendingRaw?.count || '0', 10);
    const pendingRequestsAmount = parseFloat(pendingRaw?.total || '0');

    // 3. Unpaid Expenses
    const unpaidQb = this.expenseRepo
      .createQueryBuilder('e')
      .select('COUNT(e.id)', 'count')
      .addSelect('SUM(e.amount - e.amountPaid)', 'unpaid')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false')
      .andWhere('e.paymentStatus IN (:...statuses)', {
        statuses: [
          ExpensePaymentStatus.UNPAID,
          ExpensePaymentStatus.PARTIALLY_PAID,
        ],
      });

    const unpaidRaw = await unpaidQb.getRawOne<{
      count: string | null;
      unpaid: string | null;
    }>();
    const unpaidExpensesCount = parseInt(unpaidRaw?.count || '0', 10);
    const unpaidExpensesAmount = parseFloat(unpaidRaw?.unpaid || '0');

    // 4. Budget calculations
    let totalBudget = 0;
    let totalCommitted = 0;
    let totalBudgetRemaining = 0;
    let overBudgetCount = 0;

    if (sessionId) {
      const budgetProgress = await this.budgetsService.getBudgets(
        sessionId,
        termId,
        schoolId,
      );
      totalBudget = budgetProgress.reduce((sum, b) => sum + b.budgetAmount, 0);
      totalCommitted = budgetProgress.reduce(
        (sum, b) => sum + b.committedAmount,
        0,
      );
      totalBudgetRemaining = Math.max(
        0,
        totalBudget - totalSpent - totalCommitted,
      );
      overBudgetCount = budgetProgress.filter(
        (b) => b.warningLevel === 'OVER_BUDGET',
      ).length;
    }

    // 5. Needs Attention Items
    const needsAttention: NeedsAttentionItem[] = [];

    // Pending requests needing approval
    const pendingRequests = await this.requestRepo.find({
      where: {
        schoolId,
        status: In([
          ExpenseRequestStatus.SUBMITTED,
          ExpenseRequestStatus.PENDING_APPROVAL,
        ]),
      },
      relations: ['requester', 'category'],
      order: { createdAt: 'DESC' },
      take: 4,
    });

    for (const req of pendingRequests) {
      const isReimbursement =
        req.requestType === ExpenseRequestType.REIMBURSEMENT;
      needsAttention.push({
        id: req.id,
        type: isReimbursement ? 'PENDING_REIMBURSEMENT' : 'PENDING_REQUEST',
        title: req.title,
        amount: Number(req.estimatedAmount),
        subtitle: `${isReimbursement ? 'Reimbursement' : 'Request'} by ${req.requester?.firstName || 'Staff'} (${req.category?.name || 'Category'})`,
        date: req.createdAt?.toISOString().split('T')[0],
        severity: isReimbursement ? 'warning' : 'info',
      });
    }

    // Unpaid expenses
    const unpaidExpenses = await this.expenseRepo.find({
      where: {
        schoolId,
        isVoided: false,
        paymentStatus: In([
          ExpensePaymentStatus.UNPAID,
          ExpensePaymentStatus.PARTIALLY_PAID,
        ]),
      },
      relations: ['vendor', 'category'],
      order: { expenseDate: 'ASC' },
      take: 3,
    });

    for (const exp of unpaidExpenses) {
      const balance = Number(exp.amount) - Number(exp.amountPaid || 0);
      needsAttention.push({
        id: exp.id,
        type: 'UNPAID_EXPENSE',
        title: exp.title,
        amount: balance,
        subtitle: `Payable to ${exp.vendorName || exp.vendor?.name || 'Vendor'}`,
        date: String(exp.expenseDate),
        severity: 'warning',
      });
    }

    // Recurring expenses due soon (within next 7 days or overdue)
    const todayStr = new Date().toISOString().split('T')[0];
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    const dueRecurring = await this.recurringRepo
      .createQueryBuilder('r')
      .where('r.schoolId = :schoolId', { schoolId })
      .andWhere('r.isActive = true')
      .andWhere('r.nextDueDate <= :in7DaysStr', { in7DaysStr })
      .orderBy('r.nextDueDate', 'ASC')
      .take(3)
      .getMany();

    for (const rec of dueRecurring) {
      needsAttention.push({
        id: rec.id,
        type: 'RECURRING_DUE',
        title: `Recurring: ${rec.title}`,
        amount: Number(rec.estimatedAmount),
        subtitle: `Due ${String(rec.nextDueDate)}`,
        date: String(rec.nextDueDate),
        severity: String(rec.nextDueDate) < todayStr ? 'danger' : 'info',
      });
    }

    return {
      totalSpent,
      pendingRequestsCount,
      pendingRequestsAmount,
      unpaidExpensesCount,
      unpaidExpensesAmount,
      totalBudget,
      totalBudgetRemaining,
      totalCommitted,
      overBudgetCount,
      needsAttention,
    };
  };

  getSpendingByCategory = async (
    schoolId: string,
    sessionId?: string,
    termId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ExpenseBreakdownItem[]> => {
    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .innerJoin('e.category', 'cat')
      .select('cat.id', 'key')
      .addSelect('cat.name', 'label')
      .addSelect('SUM(e.amount)', 'totalAmount')
      .addSelect('COUNT(e.id)', 'count')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false');

    if (sessionId) qb.andWhere('e.sessionId = :sessionId', { sessionId });
    if (termId) qb.andWhere('e.termId = :termId', { termId });
    if (startDate) qb.andWhere('e.expenseDate >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.expenseDate <= :endDate', { endDate });

    qb.groupBy('cat.id')
      .addGroupBy('cat.name')
      .orderBy('SUM(e.amount)', 'DESC');

    const results = await qb.getRawMany<{
      key: string;
      label: string;
      totalAmount: string;
      count: string;
    }>();

    const overallTotal = results.reduce(
      (sum, r) => sum + parseFloat(r.totalAmount || '0'),
      0,
    );

    return results.map((r) => {
      const totalAmount = parseFloat(r.totalAmount || '0');
      const percentage =
        overallTotal > 0
          ? Math.round((totalAmount / overallTotal) * 1000) / 10
          : 0;
      return {
        key: r.key,
        label: r.label,
        totalAmount,
        count: parseInt(r.count || '0', 10),
        percentage,
      };
    });
  };

  getMonthlyTrends = async (
    schoolId: string,
    year?: number,
  ): Promise<ExpenseMonthlyTrend[]> => {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .select("TO_CHAR(e.expenseDate, 'YYYY-MM')", 'month')
      .addSelect('SUM(e.amount)', 'totalSpent')
      .addSelect('COUNT(e.id)', 'expenseCount')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false')
      .andWhere('e.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("TO_CHAR(e.expenseDate, 'YYYY-MM')")
      .orderBy("TO_CHAR(e.expenseDate, 'YYYY-MM')", 'ASC');

    const results = await qb.getRawMany<{
      month: string;
      totalSpent: string;
      expenseCount: string;
    }>();

    const monthMap = new Map(results.map((r) => [r.month, r]));

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

    return monthNames.map((name, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const key = `${targetYear}-${monthNum}`;
      const found = monthMap.get(key);

      return {
        month: key,
        label: `${name} ${targetYear}`,
        totalSpent: parseFloat(found?.totalSpent || '0'),
        expenseCount: parseInt(found?.expenseCount || '0', 10),
      };
    });
  };

  getSpendingByDepartment = async (
    schoolId: string,
    sessionId?: string,
    termId?: string,
  ): Promise<ExpenseBreakdownItem[]> => {
    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .leftJoin('e.department', 'dept')
      .select(
        "COALESCE(dept.id, '00000000-0000-0000-0000-000000000000')",
        'key',
      )
      .addSelect("COALESCE(dept.name, 'General / Unassigned')", 'label')
      .addSelect('SUM(e.amount)', 'totalAmount')
      .addSelect('COUNT(e.id)', 'count')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false');

    if (sessionId) qb.andWhere('e.sessionId = :sessionId', { sessionId });
    if (termId) qb.andWhere('e.termId = :termId', { termId });

    qb.groupBy('dept.id')
      .addGroupBy('dept.name')
      .orderBy('SUM(e.amount)', 'DESC');

    const results = await qb.getRawMany<{
      key: string;
      label: string;
      totalAmount: string;
      count: string;
    }>();

    const overallTotal = results.reduce(
      (sum, r) => sum + parseFloat(r.totalAmount || '0'),
      0,
    );

    return results.map((r) => {
      const totalAmount = parseFloat(r.totalAmount || '0');
      const percentage =
        overallTotal > 0
          ? Math.round((totalAmount / overallTotal) * 1000) / 10
          : 0;
      return {
        key: r.key,
        label: r.label,
        totalAmount,
        count: parseInt(r.count || '0', 10),
        percentage,
      };
    });
  };

  getSpendingByVendor = async (
    schoolId: string,
    sessionId?: string,
    termId?: string,
  ): Promise<ExpenseBreakdownItem[]> => {
    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .leftJoin('e.vendor', 'v')
      .select("COALESCE(v.id, '00000000-0000-0000-0000-000000000000')", 'key')
      .addSelect(
        "COALESCE(v.name, e.vendorName, 'Direct / Petty Cash')",
        'label',
      )
      .addSelect('SUM(e.amount)', 'totalAmount')
      .addSelect('COUNT(e.id)', 'count')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false');

    if (sessionId) qb.andWhere('e.sessionId = :sessionId', { sessionId });
    if (termId) qb.andWhere('e.termId = :termId', { termId });

    qb.groupBy('v.id')
      .addGroupBy('v.name')
      .addGroupBy('e.vendorName')
      .orderBy('SUM(e.amount)', 'DESC');

    const results = await qb.getRawMany<{
      key: string;
      label: string;
      totalAmount: string;
      count: string;
    }>();

    const overallTotal = results.reduce(
      (sum, r) => sum + parseFloat(r.totalAmount || '0'),
      0,
    );

    return results.map((r) => {
      const totalAmount = parseFloat(r.totalAmount || '0');
      const percentage =
        overallTotal > 0
          ? Math.round((totalAmount / overallTotal) * 1000) / 10
          : 0;
      return {
        key: r.key,
        label: r.label,
        totalAmount,
        count: parseInt(r.count || '0', 10),
        percentage,
      };
    });
  };
}
