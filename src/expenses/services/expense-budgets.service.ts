import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  ExpenseBudget,
  ExpenseCategory,
  Expense,
  ExpenseRequest,
} from '../entities';
import { Session } from '../../terms/entities/session.entity';
import { Term } from '../../terms/entities/term.entity';
import {
  SetExpenseBudgetInput,
  BulkSetExpenseBudgetInput,
  CategoryBudgetProgress,
  SaveExpenseCategoryInput,
} from '../dto';
import { ExpenseRequestStatus } from '../enums';
import { ExpensesService } from './expenses.service';

@Injectable()
export class ExpenseBudgetsService {
  constructor(
    @InjectRepository(ExpenseBudget)
    private readonly budgetRepo: Repository<ExpenseBudget>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseRequest)
    private readonly requestRepo: Repository<ExpenseRequest>,
    private readonly expensesService: ExpensesService,
  ) {}

  saveCategoryWithBudget = async (
    input: SaveExpenseCategoryInput,
    schoolId: string,
  ): Promise<ExpenseCategory> =>
    this.budgetRepo.manager.transaction(async (manager) => {
      const category = input.id
        ? await this.expensesService.updateCategory(
            {
              id: input.id,
              name: input.name,
              description: input.description,
            },
            schoolId,
            manager,
          )
        : await this.expensesService.createCategory(
            { name: input.name, description: input.description },
            schoolId,
            manager,
          );

      if (input.budgetAmount === undefined) return category;
      if (!input.sessionId) {
        throw new BadRequestException(
          'A session is required when setting a category budget',
        );
      }

      const session = await manager.getRepository(Session).findOne({
        where: { id: input.sessionId, schoolId },
      });
      if (!session) throw new NotFoundException('Session not found');
      if (input.termId) {
        const term = await manager.getRepository(Term).findOne({
          where: { id: input.termId, sessionId: input.sessionId, schoolId },
        });
        if (!term) throw new NotFoundException('Term not found');
      }

      const budgetRepo = manager.getRepository(ExpenseBudget);
      let budget = await budgetRepo.findOne({
        where: {
          schoolId,
          sessionId: input.sessionId,
          termId: input.termId || IsNull(),
          categoryId: category.id,
        },
      });
      if (!budget) {
        budget = budgetRepo.create({
          schoolId,
          sessionId: input.sessionId,
          termId: input.termId,
          categoryId: category.id,
          budgetAmount: input.budgetAmount,
        });
      } else {
        budget.budgetAmount = input.budgetAmount;
      }
      await budgetRepo.save(budget);

      return category;
    });

  setBudget = async (
    input: SetExpenseBudgetInput,
    schoolId: string,
  ): Promise<ExpenseBudget> => {
    let budget = await this.budgetRepo.findOne({
      where: {
        schoolId,
        sessionId: input.sessionId,
        termId: input.termId || IsNull(),
        categoryId: input.categoryId,
      },
    });

    if (budget) {
      budget.budgetAmount = input.budgetAmount;
    } else {
      budget = this.budgetRepo.create({
        schoolId,
        sessionId: input.sessionId,
        termId: input.termId,
        categoryId: input.categoryId,
        budgetAmount: input.budgetAmount,
      });
    }

    return this.budgetRepo.save(budget);
  };

  bulkSetBudgets = async (
    input: BulkSetExpenseBudgetInput,
    schoolId: string,
  ): Promise<ExpenseBudget[]> => {
    const results: ExpenseBudget[] = [];
    for (const b of input.budgets) {
      const saved = await this.setBudget(
        {
          sessionId: input.sessionId,
          termId: input.termId,
          categoryId: b.categoryId,
          budgetAmount: b.budgetAmount,
        },
        schoolId,
      );
      results.push(saved);
    }
    return results;
  };

  getBudgets = async (
    sessionId: string,
    termId: string | null | undefined,
    schoolId: string,
  ): Promise<CategoryBudgetProgress[]> => {
    // 1. Get all active categories
    const categories = await this.expensesService.getCategories(schoolId);

    // 2. Get budgets for this session & term
    const budgetWhere: Record<string, unknown> = {
      schoolId,
      sessionId,
      termId: termId || IsNull(),
    };
    const budgets = await this.budgetRepo.find({ where: budgetWhere });
    const budgetMap = new Map(
      budgets.map((b) => [b.categoryId, Number(b.budgetAmount)]),
    );

    // 3. Get Actual Spent per category
    const expenseQb = this.expenseRepo
      .createQueryBuilder('e')
      .select('e.categoryId', 'categoryId')
      .addSelect('SUM(e.amount)', 'spent')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false');

    if (sessionId)
      expenseQb.andWhere('e.sessionId = :sessionId', { sessionId });
    if (termId) expenseQb.andWhere('e.termId = :termId', { termId });

    expenseQb.groupBy('e.categoryId');
    const spentResults = await expenseQb.getRawMany<{
      categoryId: string;
      spent: string;
    }>();
    const spentMap = new Map(
      spentResults.map((r) => [r.categoryId, parseFloat(r.spent || '0')]),
    );

    const requestPaidQb = this.requestRepo
      .createQueryBuilder('r')
      .select('r.categoryId', 'categoryId')
      .addSelect('SUM(r.amountPaid)', 'spent')
      .where('r.schoolId = :schoolId', { schoolId })
      .andWhere('r.expenseId IS NULL')
      .andWhere('r.amountPaid > 0')
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ExpenseRequestStatus.APPROVED, ExpenseRequestStatus.FUNDED],
      });
    if (sessionId)
      requestPaidQb.andWhere('r.sessionId = :sessionId', { sessionId });
    if (termId) requestPaidQb.andWhere('r.termId = :termId', { termId });
    requestPaidQb.groupBy('r.categoryId');
    const requestPaidResults = await requestPaidQb.getRawMany<{
      categoryId: string;
      spent: string;
    }>();
    for (const result of requestPaidResults) {
      spentMap.set(
        result.categoryId,
        (spentMap.get(result.categoryId) || 0) +
          parseFloat(result.spent || '0'),
      );
    }

    // 4. Get Committed amounts per category (approved or funded requests not yet converted to expense)
    const requestQb = this.requestRepo
      .createQueryBuilder('r')
      .select('r.categoryId', 'categoryId')
      .addSelect(
        'SUM(GREATEST(COALESCE(r.approvedAmount, r.estimatedAmount) - COALESCE(r.amountPaid, 0), 0))',
        'committed',
      )
      .where('r.schoolId = :schoolId', { schoolId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ExpenseRequestStatus.APPROVED, ExpenseRequestStatus.FUNDED],
      })
      .andWhere('r.expenseId IS NULL');

    if (sessionId)
      requestQb.andWhere('r.sessionId = :sessionId', { sessionId });
    if (termId) requestQb.andWhere('r.termId = :termId', { termId });

    requestQb.groupBy('r.categoryId');
    const committedResults = await requestQb.getRawMany<{
      categoryId: string;
      committed: string;
    }>();
    const committedMap = new Map(
      committedResults.map((r) => [
        r.categoryId,
        parseFloat(r.committed || '0'),
      ]),
    );

    // 5. Build CategoryBudgetProgress list
    return categories.map((cat) => {
      const budgetAmount = budgetMap.get(cat.id) ?? 0;
      const actualSpent = spentMap.get(cat.id) ?? 0;
      const committedAmount = committedMap.get(cat.id) ?? 0;
      const totalUsed = actualSpent + committedAmount;
      const availableAmount = budgetAmount - totalUsed;
      const percentageUsed =
        budgetAmount > 0
          ? Math.round((totalUsed / budgetAmount) * 1000) / 10
          : totalUsed > 0
            ? 100
            : 0;

      let warningLevel = 'NORMAL';
      if (budgetAmount > 0) {
        if (totalUsed > budgetAmount) {
          warningLevel = 'OVER_BUDGET';
        } else if (percentageUsed >= 90) {
          warningLevel = 'WARNING_90';
        } else if (percentageUsed >= 75) {
          warningLevel = 'WARNING_75';
        }
      } else if (totalUsed > 0) {
        warningLevel = 'OVER_BUDGET';
      }

      return {
        categoryId: cat.id,
        category: cat,
        budgetAmount,
        actualSpent,
        committedAmount,
        availableAmount,
        percentageUsed,
        warningLevel,
      };
    });
  };
}
