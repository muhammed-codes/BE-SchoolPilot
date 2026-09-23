import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, IsNull } from 'typeorm';

import { FeeCategory } from './entities/fee-category.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import {
  StudentFeeOverride,
  FeeOverrideType,
} from './entities/student-fee-override.entity';
import { SchoolBankAccount } from './entities/school-bank-account.entity';
import {
  StudentInvoice,
  InvoiceStatus,
} from './entities/student-invoice.entity';
import { StudentInvoiceItem } from './entities/student-invoice-item.entity';
import { PaymentSubmissionBatch } from './entities/payment-submission-batch.entity';
import {
  PaymentSubmissionStudentShare,
  PaymentShareStatus,
} from './entities/payment-submission-student-share.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import {
  FeeApprovalConfig,
  ApprovalMode,
} from './entities/fee-approval-config.entity';
import {
  FeeApprovalStep,
  ApproverType,
} from './entities/fee-approval-step.entity';
import {
  PaymentApprovalDecision,
  ApprovalDecision,
} from './entities/payment-approval-decision.entity';
import { ReceiptTemplate } from './entities/receipt-template.entity';
import { Receipt } from './entities/receipt.entity';
import { ReceiptSerialSequence } from './entities/receipt-serial-sequence.entity';
import { StaffFeeVisibilityConfig } from './entities/staff-fee-visibility-config.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { PaginationArgs } from '../common/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentParent } from '../students/entities/student-parent.entity';
import { UserRole } from '../common/enums';

import {
  CreateFeeCategoryInput,
  UpdateFeeCategoryInput,
  CreateFeeStructureInput,
  BulkCreateFeeStructureInput,
  BulkCreateOverrideInput,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  GenerateInvoicesInput,
  SubmitPaymentBatchInput,
  ApproveShareInput,
  RejectShareInput,
  UpsertApprovalConfigInput,
  UpdateVisibilityConfigInput,
} from './dto/fees.input';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeCategory)
    private readonly feeCategoryRepo: Repository<FeeCategory>,
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepo: Repository<FeeStructure>,
    @InjectRepository(StudentFeeOverride)
    private readonly overrideRepo: Repository<StudentFeeOverride>,
    @InjectRepository(SchoolBankAccount)
    private readonly bankAccountRepo: Repository<SchoolBankAccount>,
    @InjectRepository(StudentInvoice)
    private readonly invoiceRepo: Repository<StudentInvoice>,
    @InjectRepository(StudentInvoiceItem)
    private readonly invoiceItemRepo: Repository<StudentInvoiceItem>,
    @InjectRepository(PaymentSubmissionBatch)
    private readonly batchRepo: Repository<PaymentSubmissionBatch>,
    @InjectRepository(PaymentSubmissionStudentShare)
    private readonly shareRepo: Repository<PaymentSubmissionStudentShare>,
    @InjectRepository(PaymentAllocation)
    private readonly allocationRepo: Repository<PaymentAllocation>,
    @InjectRepository(FeeApprovalConfig)
    private readonly approvalConfigRepo: Repository<FeeApprovalConfig>,
    @InjectRepository(FeeApprovalStep)
    private readonly approvalStepRepo: Repository<FeeApprovalStep>,
    @InjectRepository(PaymentApprovalDecision)
    private readonly decisionRepo: Repository<PaymentApprovalDecision>,
    @InjectRepository(ReceiptTemplate)
    private readonly receiptTemplateRepo: Repository<ReceiptTemplate>,
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(ReceiptSerialSequence)
    private readonly serialSeqRepo: Repository<ReceiptSerialSequence>,
    @InjectRepository(StaffFeeVisibilityConfig)
    private readonly visibilityRepo: Repository<StaffFeeVisibilityConfig>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── BE-FM-2: Fee Category & Structure ───────────────────────────────────

  createFeeCategory(
    input: CreateFeeCategoryInput,
    schoolId: string,
    userId: string,
  ) {
    const cat = this.feeCategoryRepo.create({
      schoolId,
      name: input.name,
      recurrence: input.recurrence,
      createdBy: userId,
    });
    return this.feeCategoryRepo.save(cat);
  }

  getFeeCategories(schoolId: string) {
    return this.feeCategoryRepo.find({
      where: { schoolId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  getAllFeeCategories(schoolId: string) {
    return this.feeCategoryRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  }

  updateFeeCategory(
    id: string,
    input: UpdateFeeCategoryInput,
    schoolId: string,
  ) {
    return this.feeCategoryRepo
      .findOne({ where: { id, schoolId } })
      .then((cat) => {
        if (!cat) throw new NotFoundException('Fee category not found');
        Object.assign(cat, {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.recurrence !== undefined && {
            recurrence: input.recurrence,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        });
        return this.feeCategoryRepo.save(cat);
      });
  }

  createFeeStructure(
    input: CreateFeeStructureInput,
    schoolId: string,
    userId: string,
  ) {
    const struct = this.feeStructureRepo.create({
      schoolId,
      feeCategoryId: input.feeCategoryId,
      classId: input.classId ?? null,
      sessionId: input.sessionId,
      termId: input.termId ?? null,
      amount: input.amount,
      createdBy: userId,
    });
    return this.feeStructureRepo.save(struct).catch(() => {
      throw new BadRequestException(
        'A fee structure for this class, category, and term already exists',
      );
    });
  }

  bulkCreateFeeStructures(
    input: BulkCreateFeeStructureInput,
    schoolId: string,
    userId: string,
  ) {
    const structs = input.classIds.map((classId) =>
      this.feeStructureRepo.create({
        schoolId,
        feeCategoryId: input.feeCategoryId,
        classId,
        sessionId: input.sessionId,
        termId: input.termId ?? null,
        amount: input.amount,
        createdBy: userId,
      }),
    );
    return this.feeStructureRepo.save(structs);
  }

  getFeeStructures(schoolId: string, sessionId: string, termId?: string) {
    return this.feeStructureRepo.find({
      where: {
        schoolId,
        sessionId,
        ...(termId ? { termId } : {}),
        isActive: true,
      },
      relations: ['feeCategory'],
      order: { createdAt: 'ASC' },
    });
  }

  updateFeeStructure(id: string, amount: number, schoolId: string) {
    return this.feeStructureRepo
      .findOne({ where: { id, schoolId } })
      .then((s) => {
        if (!s) throw new NotFoundException('Fee structure not found');
        s.amount = amount;
        return this.feeStructureRepo.save(s);
      });
  }

  deactivateFeeStructure(id: string, schoolId: string) {
    return this.feeStructureRepo
      .update({ id, schoolId }, { isActive: false })
      .then(() => true);
  }

  // ─── BE-FM-3 + FM-4: Overrides / Discounts / Scholarships ────────────────

  bulkCreateOverrides(
    input: BulkCreateOverrideInput,
    schoolId: string,
    userId: string,
  ) {
    return this.dataSource.transaction((manager) =>
      Promise.all(
        input.studentIds.map((studentId) => {
          const override = manager.create(StudentFeeOverride, {
            schoolId,
            studentId,
            feeStructureId: input.feeStructureId,
            overrideAmount: input.overrideAmount,
            reason: input.reason ?? null,
            type: input.type ?? FeeOverrideType.ADJUSTMENT,
            createdBy: userId,
          });
          return manager.save(StudentFeeOverride, override);
        }),
      ),
    );
  }

  getOverrides(
    schoolId: string,
    feeStructureId?: string,
    studentId?: string,
    sessionId?: string,
    termId?: string,
    classId?: string,
    userId?: string,
  ) {
    const hasAnyFilter =
      feeStructureId || studentId || sessionId || termId || classId;
    if (!hasAnyFilter) {
      return Promise.resolve([] as StudentFeeOverride[]);
    }
    const qb = this.overrideRepo.createQueryBuilder('o');
    qb.innerJoinAndSelect('o.feeStructure', 'fs');
    qb.innerJoinAndSelect('fs.feeCategory', 'fc');
    qb.innerJoinAndSelect('o.student', 'st');
    qb.leftJoinAndSelect('fs.classEntity', 'cls');
    qb.where('o.schoolId = :schoolId', { schoolId });
    if (userId) qb.andWhere('o.studentId = :userId', { userId });
    if (feeStructureId)
      qb.andWhere('o.feeStructureId = :feeStructureId', { feeStructureId });
    if (studentId) qb.andWhere('o.studentId = :studentId', { studentId });
    if (sessionId) qb.andWhere('fs.sessionId = :sessionId', { sessionId });
    if (termId) qb.andWhere('fs.termId = :termId', { termId });
    if (classId) qb.andWhere('fs.classId = :classId', { classId });
    qb.orderBy('o.createdAt', 'DESC');
    return qb.getMany();
  }

  removeOverride(id: string, schoolId: string) {
    return this.overrideRepo.findOne({ where: { id, schoolId } }).then((o) => {
      if (!o) throw new NotFoundException('Override not found');
      return this.overrideRepo.remove(o).then(() => true);
    });
  }

  // ─── BE-FM-5: Bank Accounts ───────────────────────────────────────────────

  createBankAccount(
    input: CreateBankAccountInput,
    schoolId: string,
    userId: string,
  ) {
    const account = this.bankAccountRepo.create({
      schoolId,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      feeCategoryId: input.feeCategoryId ?? null,
      createdBy: userId,
    });
    return this.bankAccountRepo.save(account);
  }

  getBankAccounts(schoolId: string) {
    return this.bankAccountRepo.find({
      where: { schoolId },
      relations: ['feeCategory'],
      order: { createdAt: 'ASC' },
    });
  }

  updateBankAccount(
    id: string,
    input: UpdateBankAccountInput,
    schoolId: string,
  ) {
    return this.bankAccountRepo
      .findOne({ where: { id, schoolId } })
      .then((acc) => {
        if (!acc) throw new NotFoundException('Bank account not found');
        Object.assign(acc, {
          ...(input.bankName !== undefined && { bankName: input.bankName }),
          ...(input.accountNumber !== undefined && {
            accountNumber: input.accountNumber,
          }),
          ...(input.accountName !== undefined && {
            accountName: input.accountName,
          }),
          ...(input.feeCategoryId !== undefined && {
            feeCategoryId: input.feeCategoryId ?? null,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        });
        return this.bankAccountRepo.save(acc);
      });
  }

  /** Resolve the bank account(s) a parent should see for a given fee category */
  resolveBankAccountsForCategory(schoolId: string, feeCategoryId?: string) {
    return feeCategoryId
      ? this.bankAccountRepo
          .find({ where: { schoolId, feeCategoryId, isActive: true } })
          .then((accounts) =>
            accounts.length > 0
              ? accounts
              : this.bankAccountRepo.find({
                  where: { schoolId, feeCategoryId: IsNull(), isActive: true },
                }),
          )
      : this.bankAccountRepo.find({
          where: { schoolId, feeCategoryId: IsNull(), isActive: true },
        });
  }

  // ─── BE-FM-6: Invoice Generation ─────────────────────────────────────────

  generateInvoices(input: GenerateInvoicesInput, schoolId: string) {
    const { sessionId, termId, forceRegenerate } = input;

    return this.dataSource.transaction(async (manager) => {
      // Lock key to prevent concurrent generation races
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `invoice-gen:${schoolId}:${sessionId}:${termId ?? 'null'}`,
      ]);

      // Fetch all active fee structures for this session/term
      const structures = await manager.find(FeeStructure, {
        where: {
          schoolId,
          sessionId,
          ...(termId ? { termId } : { termId: IsNull() }),
          isActive: true,
        },
        relations: ['feeCategory'],
      });

      if (structures.length === 0) {
        throw new BadRequestException(
          'No active fee structures found for this session/term',
        );
      }

      // Group structures by classId
      const byClass = new Map<string | null, FeeStructure[]>();
      for (const s of structures) {
        const key = s.classId ?? null;
        if (!byClass.has(key)) byClass.set(key, []);
        byClass.get(key)!.push(s);
      }

      let generated = 0;
      let skipped = 0;

      for (const [classId, classStructures] of byClass) {
        // Get all non-archived students in this class (or whole school if classId null)
        const students = classId
          ? await manager.find(Student, {
              where: { schoolId, currentClassId: classId, isArchived: false },
            })
          : await manager.find(Student, {
              where: { schoolId, isArchived: false },
            });

        for (const student of students) {
          // Check if invoice already exists
          const existing = await manager.findOne(StudentInvoice, {
            where: {
              studentId: student.id,
              sessionId,
              ...(termId ? { termId } : { termId: IsNull() }),
            },
          });

          if (existing && !forceRegenerate) {
            skipped++;
            continue;
          }

          if (existing && forceRegenerate) {
            // Void existing items and invoice
            await manager.delete(StudentInvoiceItem, {
              studentInvoiceId: existing.id,
            });
            await manager.remove(StudentInvoice, existing);
          }

          // Fetch overrides for this student
          const structureIds = classStructures.map((s) => s.id);
          const overrides = await manager.find(StudentFeeOverride, {
            where: { studentId: student.id, feeStructureId: In(structureIds) },
          });
          const overrideMap = new Map(
            overrides.map((o) => [o.feeStructureId, o]),
          );

          // Create invoice items
          const items: StudentInvoiceItem[] = classStructures.map((struct) => {
            const override = overrideMap.get(struct.id);
            const amount = override ? override.overrideAmount : struct.amount;
            return manager.create(StudentInvoiceItem, {
              feeCategoryId: struct.feeCategoryId,
              description: struct.feeCategory.name,
              amount,
              amountPaid: 0,
              balance: amount,
            });
          });

          const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

          const invoice = manager.create(StudentInvoice, {
            schoolId,
            studentId: student.id,
            sessionId,
            termId: termId ?? null,
            totalAmount,
            totalPaid: 0,
            balance: totalAmount,
            status: InvoiceStatus.OPEN,
            generatedAt: new Date(),
          });

          const savedInvoice = await manager.save(StudentInvoice, invoice);
          for (const item of items) {
            item.studentInvoiceId = savedInvoice.id;
          }
          await manager.save(StudentInvoiceItem, items);

          generated++;
        }
      }

      return { generated, skipped };
    });
  }

  getInvoice(
    studentId: string,
    sessionId: string,
    termId?: string,
    schoolId?: string,
  ) {
    return this.invoiceRepo
      .findOne({
        where: {
          studentId,
          sessionId,
          ...(termId ? { termId } : { termId: IsNull() }),
          ...(schoolId ? { schoolId } : {}),
        },
        relations: ['items'],
      })
      .then((inv) => {
        if (!inv) throw new NotFoundException('Invoice not found');
        return inv;
      });
  }

  getStudentInvoices(studentId: string, schoolId: string) {
    return this.invoiceRepo.find({
      where: { studentId, schoolId },
      relations: ['items'],
      order: { generatedAt: 'DESC' },
    });
  }

  async getStudentInvoicesForUser(
    studentId: string,
    userId: string,
    role: UserRole,
    schoolId: string,
  ) {
    if (role === UserRole.PARENT) {
      const link = await this.studentParentRepo.findOne({
        where: { studentId, parentId: userId },
      });
      if (!link) {
        throw new ForbiddenException('You do not have access to this invoice');
      }
    }
    return this.getStudentInvoices(studentId, schoolId);
  }

  /** Returns all invoices for students in a class — for staff visibility */
  getClassInvoices(
    classId: string,
    schoolId: string,
    sessionId?: string,
    termId?: string,
  ) {
    return this.studentRepo
      .find({ where: { schoolId, currentClassId: classId, isArchived: false } })
      .then((students) => {
        if (students.length === 0) return [];
        const studentIds = students.map((s) => s.id);
        return this.invoiceRepo.find({
          where: [
            ...studentIds.map((studentId) => ({
              studentId,
              schoolId,
              ...(sessionId ? { sessionId } : {}),
              ...(termId ? { termId } : {}),
            })),
          ],
          relations: ['items'],
          order: { generatedAt: 'DESC' },
        });
      });
  }

  // ─── BE-FM-7: Payment Submission ─────────────────────────────────────────

  submitPaymentBatch(
    input: SubmitPaymentBatchInput,
    schoolId: string,
    parentId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const linkedStudents = await this.studentParentRepo.find({
        where: { parentId },
      });
      const linkedStudentIds = new Set(
        linkedStudents.map((link) => link.studentId),
      );
      const students = await this.studentRepo.find({
        where: {
          id: In(input.shares.map((share) => share.studentId)),
          schoolId,
        },
      });
      if (
        students.length !== input.shares.length ||
        input.shares.some((share) => !linkedStudentIds.has(share.studentId))
      ) {
        throw new ForbiddenException(
          'You can only submit payments for your linked children',
        );
      }

      const batch = manager.create(PaymentSubmissionBatch, {
        schoolId,
        parentId,
        proofUrl: input.proofUrl,
        proofType: input.proofType,
        bankAccountId: input.bankAccountId ?? null,
        totalAmount: input.totalAmount,
        note: input.note ?? null,
        submittedAt: new Date(),
      });
      const savedBatch = await manager.save(PaymentSubmissionBatch, batch);

      for (const shareInput of input.shares) {
        const share = manager.create(PaymentSubmissionStudentShare, {
          batchId: savedBatch.id,
          studentId: shareInput.studentId,
          amount: shareInput.amount,
          status: PaymentShareStatus.PENDING,
        });
        const savedShare = await manager.save(
          PaymentSubmissionStudentShare,
          share,
        );

        if (shareInput.allocations && shareInput.allocations.length > 0) {
          const allocationItemIds = shareInput.allocations
            .map((allocation) => allocation.studentInvoiceItemId)
            .filter((id): id is string => !!id);
          const allocationItems = allocationItemIds.length
            ? await manager.find(StudentInvoiceItem, {
                where: { id: In(allocationItemIds) },
                relations: ['invoice'],
              })
            : [];
          const validAllocationItems = new Map(
            allocationItems
              .filter(
                (item) =>
                  item.invoice?.schoolId === schoolId &&
                  item.invoice.studentId === shareInput.studentId,
              )
              .map((item) => [item.id, item]),
          );
          if (
            validAllocationItems.size !== new Set(allocationItemIds).size ||
            shareInput.allocations.some(
              (allocation) =>
                allocation.studentInvoiceItemId &&
                !validAllocationItems.has(allocation.studentInvoiceItemId),
            )
          ) {
            throw new ForbiddenException(
              'You can only allocate payments to invoices for the selected child',
            );
          }

          const allocationSum = shareInput.allocations.reduce(
            (s, a) => s + a.amount,
            0,
          );
          if (allocationSum > shareInput.amount) {
            throw new BadRequestException(
              `Allocation total (${allocationSum}) exceeds share amount (${shareInput.amount}) for student ${shareInput.studentId}`,
            );
          }

          for (const alloc of shareInput.allocations) {
            await manager.save(
              PaymentAllocation,
              manager.create(PaymentAllocation, {
                studentShareId: savedShare.id,
                studentInvoiceItemId: alloc.studentInvoiceItemId ?? null,
                amount: alloc.amount,
                allocatedBy: parentId,
                allocatedAt: new Date(),
              }),
            );
          }
        }
      }

      // Notify resolved approvers
      await this.notifyApproversOfNewSubmission(savedBatch, schoolId).catch(
        () => {
          /* non-blocking */
        },
      );

      return manager.findOne(PaymentSubmissionBatch, {
        where: { id: savedBatch.id },
        relations: ['shares', 'shares.allocations'],
      });
    });
  }

  getParentSubmissions(parentId: string, schoolId: string) {
    return this.batchRepo.find({
      where: { parentId, schoolId },
      relations: ['shares', 'shares.allocations'],
      order: { submittedAt: 'DESC' },
    });
  }

  getParentSubmissionsPaginated(
    parentId: string,
    schoolId: string,
    pagination?: PaginationArgs,
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    return this.batchRepo
      .findAndCount({
        where: { parentId, schoolId },
        relations: ['shares', 'shares.allocations'],
        order: { submittedAt: 'DESC' },
        skip,
        take: limit,
      })
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  }

  getShareById(shareId: string) {
    return this.shareRepo.findOne({
      where: { id: shareId },
      relations: ['batch', 'allocations'],
    });
  }

  // ─── BE-FM-8: Approval Workflow ────────────────────────────────────────────

  /** Resolve which approval config applies to a given fee category (or school-wide default) */
  private resolveApprovalConfig(schoolId: string, feeCategoryId?: string) {
    if (feeCategoryId) {
      return this.approvalConfigRepo
        .findOne({
          where: { schoolId, feeCategoryId },
          relations: ['steps'],
        })
        .then(
          (config) =>
            config ??
            this.approvalConfigRepo.findOne({
              where: { schoolId, feeCategoryId: IsNull() },
              relations: ['steps'],
            }),
        );
    }
    return this.approvalConfigRepo.findOne({
      where: { schoolId, feeCategoryId: IsNull() },
      relations: ['steps'],
    });
  }

  /** Get the pending approval queue for the authenticated approver */
  getPendingQueue(userId: string, userRole: string, schoolId: string) {
    return this.shareRepo
      .find({
        where: { status: PaymentShareStatus.PENDING, batch: { schoolId } },
        relations: ['batch', 'batch.bankAccount', 'allocations'],
        order: { createdAt: 'ASC' },
      })
      .then(async (shares) => {
        const eligible: PaymentSubmissionStudentShare[] = [];

        for (const share of shares) {
          const config = await this.resolveApprovalConfig(schoolId);
          if (!config) {
            // No config — any admin/bursar can approve
            eligible.push(share);
            continue;
          }

          if (config.mode === ApprovalMode.SINGLE_APPROVER) {
            const canApprove = config.steps.some(
              (step) =>
                (step.approverType === ApproverType.SPECIFIC_STAFF &&
                  step.approverId === userId) ||
                (step.approverType === ApproverType.ROLE &&
                  step.approverRole === userRole),
            );
            if (canApprove) eligible.push(share);
          } else {
            // Sequential — find the next step not yet decided
            const decisions = await this.decisionRepo.find({
              where: { studentShareId: share.id },
              order: { decidedAt: 'ASC' },
            });
            const decidedStepIds = new Set(
              decisions.map((d) => d.approvalStepId),
            );
            const sortedSteps = [...config.steps].sort(
              (a, b) => a.sequenceOrder - b.sequenceOrder,
            );
            const nextStep = sortedSteps.find((s) => !decidedStepIds.has(s.id));
            if (!nextStep) continue;

            const canApprove =
              (nextStep.approverType === ApproverType.SPECIFIC_STAFF &&
                nextStep.approverId === userId) ||
              (nextStep.approverType === ApproverType.ROLE &&
                nextStep.approverRole === userRole);
            if (canApprove) eligible.push(share);
          }
        }

        return eligible;
      });
  }

  approveShare(
    input: ApproveShareInput,
    userId: string,
    userRole: string,
    schoolId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const share = await manager.findOne(PaymentSubmissionStudentShare, {
        where: { id: input.shareId },
        relations: ['batch'],
      });
      if (!share) throw new NotFoundException('Payment share not found');
      if (share.batch.schoolId !== schoolId) throw new ForbiddenException();
      if (share.status !== PaymentShareStatus.PENDING) {
        throw new BadRequestException('Share has already been finalized');
      }

      // Resolve config
      const config = await this.resolveApprovalConfig(schoolId);
      let stepId: string | null = null;

      if (config && config.mode === ApprovalMode.ALL_REQUIRED_SEQUENTIAL) {
        const decisions = await manager.find(PaymentApprovalDecision, {
          where: { studentShareId: share.id },
        });
        const decidedStepIds = new Set(decisions.map((d) => d.approvalStepId));
        const sortedSteps = [...config.steps].sort(
          (a, b) => a.sequenceOrder - b.sequenceOrder,
        );
        const nextStep = sortedSteps.find((s) => !decidedStepIds.has(s.id));

        if (!nextStep)
          throw new BadRequestException('All steps already decided');

        const isThisApprover =
          (nextStep.approverType === ApproverType.SPECIFIC_STAFF &&
            nextStep.approverId === userId) ||
          (nextStep.approverType === ApproverType.ROLE &&
            nextStep.approverRole === userRole);
        if (!isThisApprover)
          throw new ForbiddenException('Not your approval step');

        stepId = nextStep.id;
        // Check if this is the final step
        const isLastStep =
          sortedSteps[sortedSteps.length - 1].id === nextStep.id;

        await manager.save(
          PaymentApprovalDecision,
          manager.create(PaymentApprovalDecision, {
            studentShareId: share.id,
            approvalStepId: stepId,
            decidedBy: userId,
            decision: ApprovalDecision.APPROVED,
            decidedAt: new Date(),
          }),
        );

        if (!isLastStep) {
          // Chain not complete — just save the decision and return
          return share;
        }
      } else {
        // Single approver mode or no config — record decision directly
        await manager.save(
          PaymentApprovalDecision,
          manager.create(PaymentApprovalDecision, {
            studentShareId: share.id,
            approvalStepId: null,
            decidedBy: userId,
            decision: ApprovalDecision.APPROVED,
            decidedAt: new Date(),
          }),
        );
      }

      // Update allocations if approver re-specified them
      if (input.allocations && input.allocations.length > 0) {
        await manager.delete(PaymentAllocation, { studentShareId: share.id });
        for (const alloc of input.allocations) {
          await manager.save(
            PaymentAllocation,
            manager.create(PaymentAllocation, {
              studentShareId: share.id,
              studentInvoiceItemId: alloc.studentInvoiceItemId ?? null,
              amount: alloc.amount,
              allocatedBy: userId,
              allocatedAt: new Date(),
            }),
          );
        }
      }

      // Finalize the share
      share.status = PaymentShareStatus.APPROVED;
      share.finalizedAt = new Date();
      share.finalizedBy = userId;
      await manager.save(PaymentSubmissionStudentShare, share);

      // Apply allocations to invoice
      await this.applyAllocationsToInvoice(manager, share.id, schoolId);

      // Generate receipt
      await this.generateReceipt(manager, share.id, schoolId);

      // Notify parent
      const parent = await manager.findOne(User, {
        where: { id: share.batch.parentId },
      });
      if (parent?.expoPushToken) {
        await this.notificationsService.sendPushNotification(
          parent.expoPushToken,
          '✅ Payment Approved',
          `Your payment has been approved. Your receipt is ready.`,
          { type: 'payment_approved', shareId: share.id },
        );
      }

      return share;
    });
  }

  rejectShare(input: RejectShareInput, userId: string, schoolId: string) {
    return this.dataSource.transaction(async (manager) => {
      const share = await manager.findOne(PaymentSubmissionStudentShare, {
        where: { id: input.shareId },
        relations: ['batch'],
      });
      if (!share) throw new NotFoundException('Payment share not found');
      if (share.batch.schoolId !== schoolId) throw new ForbiddenException();
      if (share.status !== PaymentShareStatus.PENDING) {
        throw new BadRequestException('Share has already been finalized');
      }

      await manager.save(
        PaymentApprovalDecision,
        manager.create(PaymentApprovalDecision, {
          studentShareId: share.id,
          approvalStepId: null,
          decidedBy: userId,
          decision: ApprovalDecision.REJECTED,
          reason: input.reason,
          decidedAt: new Date(),
        }),
      );

      share.status = PaymentShareStatus.REJECTED;
      share.rejectionReason = input.reason;
      share.finalizedAt = new Date();
      share.finalizedBy = userId;
      await manager.save(PaymentSubmissionStudentShare, share);

      // Notify parent
      const parent = await manager.findOne(User, {
        where: { id: share.batch.parentId },
      });
      if (parent?.expoPushToken) {
        await this.notificationsService.sendPushNotification(
          parent.expoPushToken,
          '❌ Payment Rejected',
          `Your payment was rejected: ${input.reason}`,
          { type: 'payment_rejected', shareId: share.id, reason: input.reason },
        );
      }

      return share;
    });
  }

  private async applyAllocationsToInvoice(
    manager: EntityManager,
    shareId: string,
    schoolId: string,
  ) {
    const allocations = await manager.find(PaymentAllocation, {
      where: { studentShareId: shareId },
    });

    for (const alloc of allocations) {
      if (!alloc.studentInvoiceItemId) continue;

      const item = await manager.findOne(StudentInvoiceItem, {
        where: { id: alloc.studentInvoiceItemId },
      });
      if (!item) continue;

      item.amountPaid = item.amountPaid + alloc.amount;
      item.balance = item.amount - item.amountPaid;
      if (item.balance < 0) item.balance = 0; // overpayment → credit
      await manager.save(StudentInvoiceItem, item);

      // Update parent invoice
      const invoice = await manager.findOne(StudentInvoice, {
        where: { id: item.studentInvoiceId, schoolId },
        relations: ['items'],
      });
      if (!invoice) continue;

      const totalPaid = invoice.items.reduce((s, i) => s + i.amountPaid, 0);
      invoice.totalPaid = totalPaid;
      invoice.balance = invoice.totalAmount - totalPaid;

      if (invoice.balance <= 0) {
        invoice.status = InvoiceStatus.PAID;
        invoice.balance = invoice.totalAmount - totalPaid; // keep credit-balance for audit
      } else if (totalPaid > 0) {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      } else {
        invoice.status = InvoiceStatus.OPEN;
      }

      await manager.save(StudentInvoice, invoice);
    }
  }

  // ─── BE-FM-9: Receipt Generation ──────────────────────────────────────────

  private async generateReceipt(
    manager: EntityManager,
    shareId: string,
    schoolId: string,
  ): Promise<void> {
    // Lock the sequence
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
      `receipt-serial:${schoolId}`,
    ]);

    let seq = await manager.findOne(ReceiptSerialSequence, {
      where: { schoolId },
    });
    if (!seq) {
      seq = manager.create(ReceiptSerialSequence, {
        schoolId,
        prefix: 'RCP',
        lastSequence: 0,
      });
    }
    seq.lastSequence += 1;
    await manager.save(ReceiptSerialSequence, seq);

    const year = new Date().getFullYear();
    const serialNumber = `${seq.prefix}-${year}-${String(seq.lastSequence).padStart(6, '0')}`;

    // Get active/default template
    const template = await manager.findOne(ReceiptTemplate, {
      where: { schoolId, isDefault: true, isActive: true },
    });

    const receipt = manager.create(Receipt, {
      studentShareId: shareId,
      templateId: template?.id ?? null,
      serialNumber,
      generatedAt: new Date(),
    });
    await manager.save(Receipt, receipt);
  }

  async getReceipt(
    shareId: string,
    userId: string,
    role: UserRole,
    schoolId: string,
  ) {
    const share = await this.shareRepo.findOne({
      where: { id: shareId },
      relations: ['batch'],
    });
    if (!share || share.batch.schoolId !== schoolId) {
      throw new NotFoundException('Receipt not found');
    }
    if (role === UserRole.PARENT && share.batch.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this receipt');
    }
    return this.receiptRepo.findOne({
      where: { studentShareId: shareId },
      relations: ['template'],
    });
  }

  // ─── Receipt Templates ────────────────────────────────────────────────────

  getReceiptTemplates(schoolId: string) {
    return this.receiptTemplateRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  }

  setDefaultReceiptTemplate(id: string, schoolId: string) {
    return this.dataSource.transaction(async (manager) => {
      // Clear all defaults for this school first
      await manager.update(ReceiptTemplate, { schoolId }, { isDefault: false });
      await manager.update(
        ReceiptTemplate,
        { id, schoolId },
        { isDefault: true },
      );
      return manager.findOne(ReceiptTemplate, { where: { id, schoolId } });
    });
  }

  createReceiptTemplate(
    name: string,
    templateKey: string,
    thumbnailUrl: string | undefined,
    schoolId: string,
  ) {
    const tpl = this.receiptTemplateRepo.create({
      schoolId,
      name,
      templateKey,
      thumbnailUrl: thumbnailUrl ?? null,
      isActive: true,
      isDefault: false,
    });
    return this.receiptTemplateRepo.save(tpl);
  }

  // ─── BE-FM-10: Notification helpers ────────────────────────────────────────

  private async notifyApproversOfNewSubmission(
    batch: PaymentSubmissionBatch,
    schoolId: string,
  ): Promise<void> {
    const config = await this.resolveApprovalConfig(schoolId);
    if (!config || config.steps.length === 0) {
      // Notify all bursars and school admins
      await this.notificationsService.notifyUsersByRole(
        schoolId,
        'bursar' as never,
        '📥 New Payment Submitted',
        'A parent has submitted a payment for approval.',
      );
      return;
    }

    if (config.mode === ApprovalMode.SINGLE_APPROVER) {
      for (const step of config.steps) {
        if (
          step.approverType === ApproverType.SPECIFIC_STAFF &&
          step.approverId
        ) {
          await this.notificationsService.notifyUser(
            step.approverId,
            '📥 New Payment Submitted',
            'A parent has submitted a payment for your approval.',
            { type: 'payment_submitted', batchId: batch.id },
          );
        } else if (
          step.approverType === ApproverType.ROLE &&
          step.approverRole
        ) {
          await this.notificationsService.notifyUsersByRole(
            schoolId,
            step.approverRole as never,
            '📥 New Payment Submitted',
            'A parent has submitted a payment for approval.',
          );
        }
      }
    } else {
      // Sequential — notify only the first step's approver(s)
      const firstStep = [...config.steps].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder,
      )[0];
      if (!firstStep) return;
      if (
        firstStep.approverType === ApproverType.SPECIFIC_STAFF &&
        firstStep.approverId
      ) {
        await this.notificationsService.notifyUser(
          firstStep.approverId,
          '📥 New Payment Submitted',
          'A parent has submitted a payment for your approval.',
          { type: 'payment_submitted', batchId: batch.id },
        );
      } else if (
        firstStep.approverType === ApproverType.ROLE &&
        firstStep.approverRole
      ) {
        await this.notificationsService.notifyUsersByRole(
          schoolId,
          firstStep.approverRole as never,
          '📥 New Payment Submitted',
          'A parent has submitted a payment for approval.',
        );
      }
    }
  }

  // ─── BE-FM-11: Staff Visibility ────────────────────────────────────────────

  getVisibilityConfig(schoolId: string) {
    return this.visibilityRepo.find({
      where: { schoolId },
      order: { role: 'ASC' },
    });
  }

  upsertVisibilityConfig(
    input: UpdateVisibilityConfigInput,
    schoolId: string,
    userId: string,
  ) {
    return this.visibilityRepo
      .findOne({ where: { schoolId, role: input.role } })
      .then((existing) => {
        if (existing) {
          existing.canViewPaymentRecords = input.canViewPaymentRecords;
          existing.updatedBy = userId;
          return this.visibilityRepo.save(existing);
        }
        const config = this.visibilityRepo.create({
          schoolId,
          role: input.role,
          canViewPaymentRecords: input.canViewPaymentRecords,
          updatedBy: userId,
        });
        return this.visibilityRepo.save(config);
      });
  }

  /** Checks if a role has visibility, then returns class invoices or throws */
  getClassInvoicesForStaff(
    userId: string,
    userRole: UserRole,
    classId: string,
    schoolId: string,
    sessionId?: string,
    termId?: string,
  ) {
    // Finance-owning roles always have full access to payment records —
    // the staff visibility config only gates teaching/leadership staff, so a
    // school admin never needs a config row to be present.
    const isFinanceOwner =
      userRole === UserRole.SCHOOL_ADMIN ||
      userRole === UserRole.BURSAR ||
      userRole === UserRole.SUPER_ADMIN;

    if (isFinanceOwner) {
      return this.getClassInvoices(classId, schoolId, sessionId, termId);
    }

    return this.visibilityRepo
      .findOne({ where: { schoolId, role: userRole } })
      .then((cfg) => {
        if (!cfg || !cfg.canViewPaymentRecords) {
          throw new ForbiddenException(
            'Your role does not have permission to view payment records',
          );
        }
        return this.getClassInvoices(classId, schoolId, sessionId, termId);
      });
  }

  // ─── Approval Config CRUD ─────────────────────────────────────────────────

  upsertApprovalConfig(
    input: UpsertApprovalConfigInput,
    schoolId: string,
    userId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      let config = await manager.findOne(FeeApprovalConfig, {
        where: {
          schoolId,
          ...(input.feeCategoryId
            ? { feeCategoryId: input.feeCategoryId }
            : { feeCategoryId: IsNull() }),
        },
        relations: ['steps'],
      });

      if (config) {
        // Delete existing steps
        await manager.delete(FeeApprovalStep, { approvalConfigId: config.id });
        config.mode = input.mode;
      } else {
        config = manager.create(FeeApprovalConfig, {
          schoolId,
          feeCategoryId: input.feeCategoryId ?? null,
          mode: input.mode,
          createdBy: userId,
        });
        config = await manager.save(FeeApprovalConfig, config);
      }

      const steps = input.steps.map((s) =>
        manager.create(FeeApprovalStep, {
          approvalConfigId: config.id,
          sequenceOrder: s.sequenceOrder,
          approverType: s.approverType,
          approverId: s.approverId ?? null,
          approverRole: s.approverRole ?? null,
        }),
      );
      await manager.save(FeeApprovalStep, steps);

      config.mode = input.mode;
      return manager.save(FeeApprovalConfig, config);
    });
  }

  getApprovalConfigs(schoolId: string) {
    return this.approvalConfigRepo.find({
      where: { schoolId },
      relations: ['steps'],
      order: { createdAt: 'ASC' },
    });
  }
}
