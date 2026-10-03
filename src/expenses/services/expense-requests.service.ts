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
  ExpenseRequest,
  Expense,
  ExpenseCategory,
  ExpenseActivity,
} from '../entities';
import {
  CreateExpenseRequestInput,
  UpdateExpenseRequestInput,
  ApproveExpenseRequestInput,
  RejectExpenseRequestInput,
  ConvertRequestToExpenseInput,
  ExpenseRequestFilterInput,
  PaginatedExpenseRequests,
} from '../dto';
import {
  ExpenseRequestStatus,
  ExpenseRequestType,
  ExpenseActivityAction,
  ExpensePaymentStatus,
} from '../enums';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { ExpensesService } from './expenses.service';

const MANAGEMENT_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.PRINCIPAL,
  UserRole.BURSAR,
];

@Injectable()
export class ExpenseRequestsService {
  private readonly logger = new Logger(ExpenseRequestsService.name);

  constructor(
    @InjectRepository(ExpenseRequest)
    private readonly requestRepo: Repository<ExpenseRequest>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    @InjectRepository(ExpenseActivity)
    private readonly activityRepo: Repository<ExpenseActivity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly expensesService: ExpensesService,
  ) {}

  createRequest = async (
    input: CreateExpenseRequestInput,
    user: User,
  ): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const category = await this.categoryRepo.findOne({
      where: { id: input.categoryId, schoolId },
    });
    if (!category) throw new NotFoundException('Selected category not found');

    if (input.estimatedAmount <= 0) {
      throw new BadRequestException('Estimated amount must be greater than 0');
    }

    // For Reimbursement, receipt is highly recommended
    if (
      input.requestType === ExpenseRequestType.REIMBURSEMENT &&
      !input.receiptUrl &&
      (!input.quotationUrls || input.quotationUrls.length === 0)
    ) {
      this.logger.warn(
        `Reimbursement created without receipt for user ${user.id}`,
      );
    }

    const request = this.requestRepo.create({
      schoolId,
      title: input.title.trim(),
      requestType: input.requestType,
      estimatedAmount: input.estimatedAmount,
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      reason: input.reason.trim(),
      neededByDate: input.neededByDate
        ? new Date(input.neededByDate)
        : undefined,
      preferredVendor: input.preferredVendor?.trim(),
      vendorId: input.vendorId,
      quotationUrls: input.quotationUrls || [],
      receiptUrl: input.receiptUrl,
      status: ExpenseRequestStatus.PENDING_APPROVAL,
      requesterId: user.id,
      sessionId: input.sessionId,
      termId: input.termId,
    });

    const saved = await this.requestRepo.save(request);

    // Log Activity
    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      saved.id,
      ExpenseActivityAction.SUBMITTED,
      user.id,
      `Submitted ${saved.requestType} request for "${saved.title}" (₦${saved.estimatedAmount.toLocaleString()})`,
    );

    // Notify Approvers/Admins in the background
    void this.notifyApprovers(schoolId, saved, user);

    return this.getRequestById(saved.id, schoolId);
  };

  updateRequest = async (
    input: UpdateExpenseRequestInput,
    user: User,
  ): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!request) throw new NotFoundException('Request not found');

    // Only allow updating if DRAFT, SUBMITTED, or PENDING_APPROVAL
    const isPending =
      request.status === ExpenseRequestStatus.DRAFT ||
      request.status === ExpenseRequestStatus.SUBMITTED ||
      request.status === ExpenseRequestStatus.PENDING_APPROVAL;

    if (!isPending) {
      throw new BadRequestException(
        `Cannot edit a request that is already ${request.status}`,
      );
    }

    // Only requester or admin can edit
    const isOwner = request.requesterId === user.id;
    const isMgmt = MANAGEMENT_ROLES.includes(user.role);
    if (!isOwner && !isMgmt) {
      throw new ForbiddenException('You can only edit your own requests');
    }

    if (input.title !== undefined) request.title = input.title.trim();
    if (input.requestType !== undefined)
      request.requestType = input.requestType;
    if (input.estimatedAmount !== undefined) {
      if (input.estimatedAmount <= 0)
        throw new BadRequestException('Estimated amount must be positive');
      request.estimatedAmount = input.estimatedAmount;
    }
    if (input.categoryId !== undefined) request.categoryId = input.categoryId;
    if (input.departmentId !== undefined)
      request.departmentId = input.departmentId;
    if (input.reason !== undefined) request.reason = input.reason.trim();
    if (input.neededByDate !== undefined)
      request.neededByDate = input.neededByDate
        ? new Date(input.neededByDate)
        : undefined;
    if (input.preferredVendor !== undefined)
      request.preferredVendor = input.preferredVendor.trim();
    if (input.vendorId !== undefined) request.vendorId = input.vendorId;
    if (input.quotationUrls !== undefined)
      request.quotationUrls = input.quotationUrls;
    if (input.receiptUrl !== undefined) request.receiptUrl = input.receiptUrl;

    const updated = await this.requestRepo.save(request);

    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      updated.id,
      ExpenseActivityAction.UPDATED,
      user.id,
      `Updated request "${updated.title}"`,
    );

    return this.getRequestById(updated.id, schoolId);
  };

  approveRequest = async (
    input: ApproveExpenseRequestInput,
    user: User,
  ): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id: input.id, schoolId },
      relations: ['requester'],
    });
    if (!request) throw new NotFoundException('Request not found');

    if (
      request.status !== ExpenseRequestStatus.SUBMITTED &&
      request.status !== ExpenseRequestStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Cannot approve request with status "${request.status}"`,
      );
    }

    const approvedAmount =
      input.approvedAmount ?? Number(request.estimatedAmount);
    request.status = ExpenseRequestStatus.APPROVED;
    request.approvedAmount = approvedAmount;
    request.approverId = user.id;
    request.approvedAt = new Date();

    const saved = await this.requestRepo.save(request);

    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      saved.id,
      ExpenseActivityAction.APPROVED,
      user.id,
      `Approved request for ₦${approvedAmount.toLocaleString()}`,
    );

    // Notify requester
    if (request.requester?.expoPushToken) {
      void this.notificationsService.sendPushNotification(
        request.requester.expoPushToken,
        'Spending Request Approved',
        `Your request "${request.title}" for ₦${approvedAmount.toLocaleString()} has been approved.`,
        { requestId: request.id },
      );
    }

    return this.getRequestById(saved.id, schoolId);
  };

  rejectRequest = async (
    input: RejectExpenseRequestInput,
    user: User,
  ): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id: input.id, schoolId },
      relations: ['requester'],
    });
    if (!request) throw new NotFoundException('Request not found');

    if (
      request.status !== ExpenseRequestStatus.SUBMITTED &&
      request.status !== ExpenseRequestStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Cannot reject request with status "${request.status}"`,
      );
    }

    request.status = ExpenseRequestStatus.REJECTED;
    request.rejectionReason = input.rejectionReason.trim();
    request.approverId = user.id;

    const saved = await this.requestRepo.save(request);

    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      saved.id,
      ExpenseActivityAction.REJECTED,
      user.id,
      `Rejected request. Reason: ${input.rejectionReason}`,
    );

    // Notify requester
    if (request.requester?.expoPushToken) {
      void this.notificationsService.sendPushNotification(
        request.requester.expoPushToken,
        'Spending Request Rejected',
        `Your request "${request.title}" was not approved. Reason: ${input.rejectionReason}`,
        { requestId: request.id },
      );
    }

    return this.getRequestById(saved.id, schoolId);
  };

  fundRequest = async (id: string, user: User): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id, schoolId },
      relations: ['requester'],
    });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== ExpenseRequestStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be funded');
    }

    request.status = ExpenseRequestStatus.FUNDED;
    request.fundedAt = new Date();

    const saved = await this.requestRepo.save(request);

    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      saved.id,
      ExpenseActivityAction.FUNDED,
      user.id,
      `Disbursed / funded request (₦${Number(saved.approvedAmount || saved.estimatedAmount).toLocaleString()})`,
    );

    if (request.requester?.expoPushToken) {
      void this.notificationsService.sendPushNotification(
        request.requester.expoPushToken,
        'Spending Request Funded',
        `Funds for your request "${request.title}" have been disbursed.`,
        { requestId: request.id },
      );
    }

    return this.getRequestById(saved.id, schoolId);
  };

  convertRequestToExpense = async (
    input: ConvertRequestToExpenseInput,
    user: User,
  ): Promise<Expense> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id: input.requestId, schoolId },
      relations: ['requester'],
    });
    if (!request) throw new NotFoundException('Request not found');

    if (
      request.status !== ExpenseRequestStatus.APPROVED &&
      request.status !== ExpenseRequestStatus.FUNDED
    ) {
      throw new BadRequestException(
        `Only approved or funded requests can be converted to an expense. Current status: ${request.status}`,
      );
    }

    // Create the expense linked to this request
    const expense = this.expenseRepo.create({
      schoolId,
      title: request.title,
      amount: input.actualAmount,
      expenseDate: new Date(input.expenseDate),
      categoryId: request.categoryId,
      departmentId: request.departmentId,
      vendorId: input.vendorId || request.vendorId,
      vendorName: input.vendorName || request.preferredVendor,
      paymentMethod: input.paymentMethod,
      paymentStatus: ExpensePaymentStatus.PAID,
      amountPaid: input.actualAmount,
      referenceNumber: input.referenceNumber?.trim(),
      receiptUrl: input.receiptUrl || request.receiptUrl,
      notes: input.notes?.trim() || request.reason,
      requestId: request.id,
      sessionId: request.sessionId,
      termId: request.termId,
      createdById: user.id,
      isVoided: false,
    });

    const savedExpense = await this.expenseRepo.save(expense);

    // Update the request with actualAmount, expenseId, and status COMPLETED
    request.actualAmount = input.actualAmount;
    request.expenseId = savedExpense.id;
    request.status = ExpenseRequestStatus.COMPLETED;
    request.completedAt = new Date();
    await this.requestRepo.save(request);

    // Log activity on both request and expense
    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      request.id,
      ExpenseActivityAction.CONVERTED_TO_EXPENSE,
      user.id,
      `Converted request into Expense with actual spend of ₦${input.actualAmount.toLocaleString()}`,
    );

    await this.expensesService.logActivity(
      schoolId,
      'EXPENSE',
      savedExpense.id,
      ExpenseActivityAction.CREATED,
      user.id,
      `Created from approved Request "${request.title}"`,
    );

    return this.expensesService.getExpenseById(savedExpense.id, schoolId);
  };

  cancelRequest = async (id: string, user: User): Promise<ExpenseRequest> => {
    const schoolId = user.schoolId;
    if (!schoolId) throw new ForbiddenException('User must belong to a school');

    const request = await this.requestRepo.findOne({
      where: { id, schoolId },
    });
    if (!request) throw new NotFoundException('Request not found');

    if (
      request.status !== ExpenseRequestStatus.DRAFT &&
      request.status !== ExpenseRequestStatus.SUBMITTED &&
      request.status !== ExpenseRequestStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Cannot cancel request with status "${request.status}"`,
      );
    }

    const isOwner = request.requesterId === user.id;
    const isMgmt = MANAGEMENT_ROLES.includes(user.role);
    if (!isOwner && !isMgmt) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    request.status = ExpenseRequestStatus.CANCELLED;
    const saved = await this.requestRepo.save(request);

    await this.expensesService.logActivity(
      schoolId,
      'REQUEST',
      saved.id,
      ExpenseActivityAction.CANCELLED,
      user.id,
      `Cancelled request "${saved.title}"`,
    );

    return this.getRequestById(saved.id, schoolId);
  };

  getRequests = async (
    filter: ExpenseRequestFilterInput,
    schoolId: string,
    user: User,
  ): Promise<PaginatedExpenseRequests> => {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.category', 'category')
      .leftJoinAndSelect('r.department', 'department')
      .leftJoinAndSelect('r.vendor', 'vendor')
      .leftJoinAndSelect('r.requester', 'requester')
      .leftJoinAndSelect('r.approver', 'approver')
      .leftJoinAndSelect('r.expense', 'expense')
      .where('r.schoolId = :schoolId', { schoolId });

    // If regular staff / teacher and no requesterId filter is given, only show their own requests
    const isMgmt = MANAGEMENT_ROLES.includes(user.role);
    if (!isMgmt && !filter.requesterId) {
      qb.andWhere('r.requesterId = :myUserId', { myUserId: user.id });
    } else if (filter.requesterId) {
      qb.andWhere('r.requesterId = :requesterId', {
        requesterId: filter.requesterId,
      });
    }

    if (filter.status) {
      qb.andWhere('r.status = :status', { status: filter.status });
    }

    if (filter.requestType) {
      qb.andWhere('r.requestType = :requestType', {
        requestType: filter.requestType,
      });
    }

    if (filter.categoryId) {
      qb.andWhere('r.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.departmentId) {
      qb.andWhere('r.departmentId = :departmentId', {
        departmentId: filter.departmentId,
      });
    }

    if (filter.sessionId) {
      qb.andWhere('r.sessionId = :sessionId', { sessionId: filter.sessionId });
    }

    if (filter.termId) {
      qb.andWhere('r.termId = :termId', { termId: filter.termId });
    }

    if (filter.startDate) {
      qb.andWhere('r.createdAt >= :startDate', { startDate: filter.startDate });
    }

    if (filter.endDate) {
      qb.andWhere('r.createdAt <= :endDate', { endDate: filter.endDate });
    }

    if (filter.search?.trim()) {
      const search = `%${filter.search.trim()}%`;
      qb.andWhere(
        '(r.title ILIKE :search OR r.reason ILIKE :search OR requester.firstName ILIKE :search OR requester.lastName ILIKE :search)',
        { search },
      );
    }

    // Total estimated amount
    const totalRaw = await qb
      .clone()
      .select('SUM(r.estimatedAmount)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const totalEstimatedAmount = parseFloat(totalRaw?.sum || '0');

    qb.orderBy('r.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalEstimatedAmount,
    };
  };

  getRequestById = async (
    id: string,
    schoolId: string,
  ): Promise<ExpenseRequest> => {
    const request = await this.requestRepo.findOne({
      where: { id, schoolId },
      relations: [
        'category',
        'department',
        'vendor',
        'requester',
        'approver',
        'expense',
        'session',
        'term',
      ],
    });
    if (!request) throw new NotFoundException('Expense request not found');
    return request;
  };

  getRequestActivities = async (
    requestId: string,
    schoolId: string,
  ): Promise<ExpenseActivity[]> => {
    return this.activityRepo.find({
      where: { schoolId, entityType: 'REQUEST', entityId: requestId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  };

  private notifyApprovers = async (
    schoolId: string,
    request: ExpenseRequest,
    requester: User,
  ): Promise<void> => {
    try {
      const approvers = await this.userRepo.find({
        where: [
          { schoolId, role: UserRole.SCHOOL_ADMIN, isActive: true },
          { schoolId, role: UserRole.PRINCIPAL, isActive: true },
          { schoolId, role: UserRole.BURSAR, isActive: true },
        ],
      });

      const tokens = approvers
        .map((a) => a.expoPushToken)
        .filter((t): t is string => Boolean(t));

      if (tokens.length > 0) {
        await this.notificationsService.sendBulkNotifications(
          tokens,
          'New Spending Request',
          `${requester.firstName} ${requester.lastName} requested ₦${Number(request.estimatedAmount).toLocaleString()} for "${request.title}"`,
          { requestId: request.id },
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to notify approvers: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };
}
