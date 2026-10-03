import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Expense,
  ExpenseCategory,
  ExpenseDepartment,
  ExpenseVendor,
  ExpenseActivity,
} from '../entities';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  VoidExpenseInput,
  ExpenseFilterInput,
  PaginatedExpenses,
  DuplicateExpenseWarning,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateExpenseDepartmentInput,
} from '../dto';
import {
  ExpensePaymentMethod,
  ExpensePaymentStatus,
  ExpenseActivityAction,
} from '../enums';
import { User } from '../../users/entities/user.entity';
import { PettyCashService } from './petty-cash.service';

const DEFAULT_CATEGORIES = [
  {
    name: 'Electricity & Utilities',
    description: 'Electricity bills, power generator, water',
  },
  {
    name: 'Fuel & Diesel',
    description: 'Fuel for school buses, generator, vehicles',
  },
  {
    name: 'Repairs & Maintenance',
    description: 'Building, plumbing, electrical, carpentry repairs',
  },
  {
    name: 'Stationery & Printing',
    description: 'Paper, ink, printing exams, office supplies',
  },
  {
    name: 'Teaching & Classroom Materials',
    description: 'Chalk, whiteboards, lab practicals, learning aids',
  },
  {
    name: 'Internet & ICT',
    description: 'Broadband, software subscriptions, computer lab repairs',
  },
  { name: 'Security', description: 'Security personnel, guards, equipment' },
  {
    name: 'Cleaning & Sanitation',
    description: 'Cleaning supplies, waste disposal, fumigation',
  },
  {
    name: 'Transport & Logistics',
    description: 'Bus maintenance, travel, logistics',
  },
  {
    name: 'Examination & Assessment',
    description: 'External exam fees, question printing, answer booklets',
  },
  {
    name: 'Staff Welfare & Hospitality',
    description: 'Refreshments, staff meetings, events',
  },
  {
    name: 'Events & Competitions',
    description: 'Sports day, inter-school competitions, end of year',
  },
  {
    name: 'Equipment & Furniture',
    description: 'Desks, chairs, projectors, lab apparatus',
  },
  { name: 'Other Expenses', description: 'Miscellaneous operational expenses' },
];

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    @InjectRepository(ExpenseDepartment)
    private readonly departmentRepo: Repository<ExpenseDepartment>,
    @InjectRepository(ExpenseVendor)
    private readonly vendorRepo: Repository<ExpenseVendor>,
    @InjectRepository(ExpenseActivity)
    private readonly activityRepo: Repository<ExpenseActivity>,
    private readonly pettyCashService: PettyCashService,
  ) {}

  // ── CATEGORIES ─────────────────────────────────────────────────────────────

  getCategories = async (schoolId: string): Promise<ExpenseCategory[]> => {
    let categories = await this.categoryRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });

    // Auto-seed starter categories if none exist for this school
    if (categories.length === 0) {
      const toCreate = DEFAULT_CATEGORIES.map((cat) =>
        this.categoryRepo.create({
          schoolId,
          name: cat.name,
          description: cat.description,
          isActive: true,
        }),
      );
      categories = await this.categoryRepo.save(toCreate);
    }

    return categories;
  };

  createCategory = async (
    input: CreateExpenseCategoryInput,
    schoolId: string,
  ): Promise<ExpenseCategory> => {
    const existing = await this.categoryRepo.findOne({
      where: { schoolId, name: input.name.trim() },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        if (input.description) existing.description = input.description.trim();
        return this.categoryRepo.save(existing);
      }
      throw new BadRequestException(`Category "${input.name}" already exists`);
    }

    const category = this.categoryRepo.create({
      schoolId,
      name: input.name.trim(),
      description: input.description?.trim(),
      isActive: true,
    });
    return this.categoryRepo.save(category);
  };

  updateCategory = async (
    input: UpdateExpenseCategoryInput,
    schoolId: string,
  ): Promise<ExpenseCategory> => {
    const category = await this.categoryRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!category) throw new NotFoundException('Category not found');

    if (input.name !== undefined) category.name = input.name.trim();
    if (input.description !== undefined)
      category.description = input.description.trim();
    if (input.isActive !== undefined) category.isActive = input.isActive;

    return this.categoryRepo.save(category);
  };

  // ── DEPARTMENTS ────────────────────────────────────────────────────────────

  getDepartments = async (schoolId: string): Promise<ExpenseDepartment[]> => {
    return this.departmentRepo.find({
      where: { schoolId, isActive: true },
      order: { name: 'ASC' },
    });
  };

  createDepartment = async (
    input: CreateExpenseDepartmentInput,
    schoolId: string,
  ): Promise<ExpenseDepartment> => {
    const dept = this.departmentRepo.create({
      schoolId,
      name: input.name.trim(),
      code: input.code?.trim(),
      isActive: true,
    });
    return this.departmentRepo.save(dept);
  };

  // ── EXPENSES CRUD ──────────────────────────────────────────────────────────

  createExpense = async (
    input: CreateExpenseInput,
    user: User,
  ): Promise<Expense> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    // Validate category
    const category = await this.categoryRepo.findOne({
      where: { id: input.categoryId, schoolId },
    });
    if (!category) throw new NotFoundException('Selected category not found');

    // Amount validation
    if (input.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0');
    }

    const amountPaid =
      input.paymentStatus === ExpensePaymentStatus.PAID
        ? input.amount
        : (input.amountPaid ?? 0);

    const expense = this.expenseRepo.create({
      schoolId,
      title: input.title.trim(),
      amount: input.amount,
      expenseDate: new Date(input.expenseDate),
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      vendorId: input.vendorId,
      vendorName: input.vendorName?.trim(),
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      amountPaid,
      referenceNumber: input.referenceNumber?.trim(),
      receiptUrl: input.receiptUrl,
      notes: input.notes?.trim(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      requestId: input.requestId,
      recurringExpenseId: input.recurringExpenseId,
      sessionId: input.sessionId,
      termId: input.termId,
      createdById: user.id,
      isVoided: false,
    });

    const saved = await this.expenseRepo.save(expense);

    // If paid via PETTY_CASH, disburse from petty cash account
    if (
      input.paymentMethod === ExpensePaymentMethod.PETTY_CASH &&
      amountPaid > 0
    ) {
      try {
        await this.pettyCashService.disburse(
          amountPaid,
          `Expense: ${saved.title}`,
          saved.id,
          user,
        );
      } catch (err) {
        this.logger.warn(
          `Petty cash auto-disbursement warning: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Log activity
    await this.logActivity(
      schoolId,
      'EXPENSE',
      saved.id,
      ExpenseActivityAction.CREATED,
      user.id,
      `Recorded expense of ₦${saved.amount.toLocaleString()} for "${saved.title}" via ${saved.paymentMethod}`,
    );

    return this.getExpenseById(saved.id, schoolId);
  };

  updateExpense = async (
    input: UpdateExpenseInput,
    user: User,
  ): Promise<Expense> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const expense = await this.expenseRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.isVoided) {
      throw new BadRequestException('Cannot update a voided expense');
    }

    if (input.title !== undefined) expense.title = input.title.trim();
    if (input.amount !== undefined) {
      if (input.amount <= 0)
        throw new BadRequestException('Amount must be positive');
      expense.amount = input.amount;
    }
    if (input.expenseDate !== undefined)
      expense.expenseDate = new Date(input.expenseDate);
    if (input.categoryId !== undefined) expense.categoryId = input.categoryId;
    if (input.departmentId !== undefined)
      expense.departmentId = input.departmentId;
    if (input.vendorId !== undefined) expense.vendorId = input.vendorId;
    if (input.vendorName !== undefined)
      expense.vendorName = input.vendorName.trim();
    if (input.paymentMethod !== undefined)
      expense.paymentMethod = input.paymentMethod;
    if (input.paymentStatus !== undefined)
      expense.paymentStatus = input.paymentStatus;
    if (input.amountPaid !== undefined) expense.amountPaid = input.amountPaid;
    if (input.referenceNumber !== undefined)
      expense.referenceNumber = input.referenceNumber.trim();
    if (input.receiptUrl !== undefined) expense.receiptUrl = input.receiptUrl;
    if (input.notes !== undefined) expense.notes = input.notes.trim();
    if (input.dueDate !== undefined)
      expense.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;

    const updated = await this.expenseRepo.save(expense);

    await this.logActivity(
      schoolId,
      'EXPENSE',
      updated.id,
      ExpenseActivityAction.UPDATED,
      user.id,
      `Updated expense details for "${updated.title}"`,
    );

    return this.getExpenseById(updated.id, schoolId);
  };

  voidExpense = async (
    input: VoidExpenseInput,
    user: User,
  ): Promise<Expense> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const expense = await this.expenseRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.isVoided) {
      throw new BadRequestException('Expense is already voided');
    }

    expense.isVoided = true;
    expense.paymentStatus = ExpensePaymentStatus.VOIDED;
    expense.voidReason = input.reason?.trim() || 'Voided by administrator';
    expense.voidedById = user.id;
    expense.voidedAt = new Date();

    const voided = await this.expenseRepo.save(expense);

    await this.logActivity(
      schoolId,
      'EXPENSE',
      voided.id,
      ExpenseActivityAction.VOIDED,
      user.id,
      `Voided expense "${voided.title}" (₦${voided.amount.toLocaleString()}). Reason: ${expense.voidReason}`,
    );

    return this.getExpenseById(voided.id, schoolId);
  };

  getExpenses = async (
    filter: ExpenseFilterInput,
    schoolId: string,
  ): Promise<PaginatedExpenses> => {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.category', 'category')
      .leftJoinAndSelect('e.department', 'department')
      .leftJoinAndSelect('e.vendor', 'vendor')
      .leftJoinAndSelect('e.createdBy', 'createdBy')
      .leftJoinAndSelect('e.voidedBy', 'voidedBy')
      .where('e.schoolId = :schoolId', { schoolId });

    if (!filter.includeVoided) {
      qb.andWhere('e.isVoided = false');
    }

    if (filter.search?.trim()) {
      const search = `%${filter.search.trim()}%`;
      qb.andWhere(
        '(e.title ILIKE :search OR e.vendorName ILIKE :search OR e.referenceNumber ILIKE :search OR vendor.name ILIKE :search)',
        { search },
      );
    }

    if (filter.categoryId) {
      qb.andWhere('e.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.departmentId) {
      qb.andWhere('e.departmentId = :departmentId', {
        departmentId: filter.departmentId,
      });
    }

    if (filter.vendorId) {
      qb.andWhere('e.vendorId = :vendorId', { vendorId: filter.vendorId });
    }

    if (filter.paymentMethod) {
      qb.andWhere('e.paymentMethod = :paymentMethod', {
        paymentMethod: filter.paymentMethod,
      });
    }

    if (filter.paymentStatus) {
      qb.andWhere('e.paymentStatus = :paymentStatus', {
        paymentStatus: filter.paymentStatus,
      });
    }

    if (filter.sessionId) {
      qb.andWhere('e.sessionId = :sessionId', { sessionId: filter.sessionId });
    }

    if (filter.termId) {
      qb.andWhere('e.termId = :termId', { termId: filter.termId });
    }

    if (filter.startDate) {
      qb.andWhere('e.expenseDate >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      qb.andWhere('e.expenseDate <= :endDate', { endDate: filter.endDate });
    }

    // Get total amount
    const totalAmountRaw = await qb
      .clone()
      .select('SUM(e.amount)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const totalAmount = parseFloat(totalAmountRaw?.sum || '0');

    qb.orderBy('e.expenseDate', 'DESC').addOrderBy('e.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalAmount,
    };
  };

  getExpenseById = async (id: string, schoolId: string): Promise<Expense> => {
    const expense = await this.expenseRepo.findOne({
      where: { id, schoolId },
      relations: [
        'category',
        'department',
        'vendor',
        'createdBy',
        'voidedBy',
        'session',
        'term',
      ],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  };

  checkDuplicate = async (
    input: CreateExpenseInput,
    schoolId: string,
  ): Promise<DuplicateExpenseWarning> => {
    const expenseDate = new Date(input.expenseDate);
    const dateStart = new Date(expenseDate);
    dateStart.setDate(dateStart.getDate() - 3);
    const dateEnd = new Date(expenseDate);
    dateEnd.setDate(dateEnd.getDate() + 3);

    const qb = this.expenseRepo
      .createQueryBuilder('e')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.isVoided = false')
      .andWhere('e.expenseDate BETWEEN :dateStart AND :dateEnd', {
        dateStart: dateStart.toISOString().split('T')[0],
        dateEnd: dateEnd.toISOString().split('T')[0],
      })
      .andWhere('e.amount = :amount', { amount: input.amount });

    if (input.referenceNumber?.trim()) {
      qb.orWhere(
        '(e.schoolId = :schoolId AND e.referenceNumber = :ref AND e.isVoided = false)',
        {
          schoolId,
          ref: input.referenceNumber.trim(),
        },
      );
    }

    const matched = await qb.getOne();

    if (matched) {
      return {
        isPossibleDuplicate: true,
        message: `Possible duplicate expense: Found "${matched.title}" with same amount ₦${Number(matched.amount).toLocaleString()} on ${String(matched.expenseDate)}.`,
        matchedExpenseId: matched.id,
        matchedExpenseTitle: matched.title,
        matchedExpenseAmount: Number(matched.amount),
        matchedExpenseDate: String(matched.expenseDate),
      };
    }

    return { isPossibleDuplicate: false };
  };

  getExpenseActivities = async (
    expenseId: string,
    schoolId: string,
  ): Promise<ExpenseActivity[]> => {
    return this.activityRepo.find({
      where: { schoolId, entityType: 'EXPENSE', entityId: expenseId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  };

  logActivity = async (
    schoolId: string,
    entityType: string,
    entityId: string,
    action: ExpenseActivityAction,
    actorId: string,
    details?: string,
  ): Promise<ExpenseActivity> => {
    const activity = this.activityRepo.create({
      schoolId,
      entityType,
      entityId,
      action,
      actorId,
      details,
    });
    return this.activityRepo.save(activity);
  };
}
