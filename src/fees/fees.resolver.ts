import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { FeesService } from './fees.service';
import { FeeCategory } from './entities/fee-category.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFeeOverride } from './entities/student-fee-override.entity';
import { SchoolBankAccount } from './entities/school-bank-account.entity';
import { StudentInvoice } from './entities/student-invoice.entity';
import { PaymentSubmissionBatch } from './entities/payment-submission-batch.entity';
import { PaymentSubmissionStudentShare } from './entities/payment-submission-student-share.entity';
import { FeeApprovalConfig } from './entities/fee-approval-config.entity';
import { ReceiptTemplate } from './entities/receipt-template.entity';
import { Receipt } from './entities/receipt.entity';
import { StaffFeeVisibilityConfig } from './entities/staff-fee-visibility-config.entity';

import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';

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
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class GenerateInvoicesResult {
  @Field(() => Int)
  generated!: number;

  @Field(() => Int)
  skipped!: number;
}

const FINANCE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.BURSAR,
];

const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.BURSAR,
  UserRole.PRINCIPAL,
  UserRole.VICE_PRINCIPAL,
  UserRole.HEAD_TEACHER,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
];

type AuthUser = { sub: string; schoolId: string; role: UserRole };

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class FeesResolver {
  constructor(private readonly feesService: FeesService) {}

  // ─── Fee Categories ───────────────────────────────────────────────────────

  @Mutation(() => FeeCategory)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  createFeeCategory(
    @Args('input') input: CreateFeeCategoryInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.createFeeCategory(input, user.schoolId, user.sub);
  }

  @Query(() => [FeeCategory])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  feeCategories(@CurrentUser() user: AuthUser) {
    return this.feesService.getFeeCategories(user.schoolId);
  }

  @Query(() => [FeeCategory])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  allFeeCategories(@CurrentUser() user: AuthUser) {
    return this.feesService.getAllFeeCategories(user.schoolId);
  }

  @Mutation(() => FeeCategory)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  updateFeeCategory(
    @Args('id') id: string,
    @Args('input') input: UpdateFeeCategoryInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.updateFeeCategory(id, input, user.schoolId);
  }

  // ─── Fee Structures ────────────────────────────────────────────────────────

  @Mutation(() => FeeStructure)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  createFeeStructure(
    @Args('input') input: CreateFeeStructureInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.createFeeStructure(input, user.schoolId, user.sub);
  }

  @Mutation(() => [FeeStructure])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  bulkCreateFeeStructures(
    @Args('input') input: BulkCreateFeeStructureInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.bulkCreateFeeStructures(
      input,
      user.schoolId,
      user.sub,
    );
  }

  @Query(() => [FeeStructure])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  feeStructures(
    @Args('sessionId') sessionId: string,
    @Args('termId', { type: () => String, nullable: true })
    termId: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.getFeeStructures(user.schoolId, sessionId, termId);
  }

  @Mutation(() => FeeStructure)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  updateFeeStructureAmount(
    @Args('id') id: string,
    @Args('amount', { type: () => Int }) amount: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.updateFeeStructure(id, amount, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  deactivateFeeStructure(
    @Args('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.deactivateFeeStructure(id, user.schoolId);
  }

  // ─── Overrides / Discounts ────────────────────────────────────────────────

  @Mutation(() => [StudentFeeOverride])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  bulkCreateFeeOverrides(
    @Args('input') input: BulkCreateOverrideInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.bulkCreateOverrides(input, user.schoolId, user.sub);
  }

  @Query(() => [StudentFeeOverride])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  feeOverrides(
    @CurrentUser() user: AuthUser,
    @Args('feeStructureId', { type: () => String, nullable: true })
    feeStructureId?: string,
    @Args('studentId', { type: () => String, nullable: true })
    studentId?: string,
    @Args('sessionId', { type: () => String, nullable: true })
    sessionId?: string,
    @Args('termId', { type: () => String, nullable: true })
    termId?: string,
    @Args('classId', { type: () => String, nullable: true })
    classId?: string,
  ) {
    return this.feesService.getOverrides(
      user.schoolId,
      feeStructureId,
      studentId,
      sessionId,
      termId,
      classId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  removeFeeOverride(@Args('id') id: string, @CurrentUser() user: AuthUser) {
    return this.feesService.removeOverride(id, user.schoolId);
  }

  // ─── Bank Accounts ────────────────────────────────────────────────────────

  @Mutation(() => SchoolBankAccount)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  createBankAccount(
    @Args('input') input: CreateBankAccountInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.createBankAccount(input, user.schoolId, user.sub);
  }

  @Query(() => [SchoolBankAccount])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  bankAccounts(@CurrentUser() user: AuthUser) {
    return this.feesService.getBankAccounts(user.schoolId);
  }

  @Mutation(() => SchoolBankAccount)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  updateBankAccount(
    @Args('id') id: string,
    @Args('input') input: UpdateBankAccountInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.updateBankAccount(id, input, user.schoolId);
  }

  @Query(() => [SchoolBankAccount])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  resolvedBankAccounts(
    @CurrentUser() user: AuthUser,
    @Args('feeCategoryId', { type: () => String, nullable: true })
    feeCategoryId?: string,
  ) {
    return this.feesService.resolveBankAccountsForCategory(
      user.schoolId,
      feeCategoryId,
    );
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  @Mutation(() => GenerateInvoicesResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  generateInvoices(
    @Args('input') input: GenerateInvoicesInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.generateInvoices(input, user.schoolId);
  }

  @Query(() => [StudentInvoice])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  myStudentInvoices(
    @Args('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.getStudentInvoices(studentId, user.schoolId);
  }

  @Query(() => [StudentInvoice])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  classInvoices(
    @Args('classId') classId: string,
    @CurrentUser() user: AuthUser,
    @Args('sessionId', { type: () => String, nullable: true })
    sessionId?: string,
    @Args('termId', { type: () => String, nullable: true })
    termId?: string,
  ) {
    return this.feesService.getClassInvoicesForStaff(
      user.sub,
      user.role,
      classId,
      user.schoolId,
      sessionId,
      termId,
    );
  }

  // ─── Payment Submissions ──────────────────────────────────────────────────

  @Mutation(() => PaymentSubmissionBatch)
  @UseGuards(JwtAuthGuard, RolesGuard)
  submitPaymentBatch(
    @Args('input') input: SubmitPaymentBatchInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.submitPaymentBatch(input, user.schoolId, user.sub);
  }

  @Query(() => [PaymentSubmissionBatch])
  @UseGuards(JwtAuthGuard, RolesGuard)
  myPaymentSubmissions(@CurrentUser() user: AuthUser) {
    return this.feesService.getParentSubmissions(user.sub, user.schoolId);
  }

  // ─── Approval Queue ────────────────────────────────────────────────────────

  @Query(() => [PaymentSubmissionStudentShare])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  pendingApprovalQueue(@CurrentUser() user: AuthUser) {
    return this.feesService.getPendingQueue(user.sub, user.role, user.schoolId);
  }

  @Mutation(() => PaymentSubmissionStudentShare)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, PermissionAction.APPROVE)
  approvePaymentShare(
    @Args('input') input: ApproveShareInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.approveShare(
      input,
      user.sub,
      user.role,
      user.schoolId,
    );
  }

  @Mutation(() => PaymentSubmissionStudentShare)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, PermissionAction.APPROVE)
  rejectPaymentShare(
    @Args('input') input: RejectShareInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.rejectShare(input, user.sub, user.schoolId);
  }

  // ─── Approval Config ───────────────────────────────────────────────────────

  @Mutation(() => FeeApprovalConfig)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, PermissionAction.CONFIGURE)
  upsertApprovalConfig(
    @Args('input') input: UpsertApprovalConfigInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.upsertApprovalConfig(
      input,
      user.schoolId,
      user.sub,
    );
  }

  @Query(() => [FeeApprovalConfig])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  approvalConfigs(@CurrentUser() user: AuthUser) {
    return this.feesService.getApprovalConfigs(user.schoolId);
  }

  // ─── Receipts ──────────────────────────────────────────────────────────────

  @Query(() => Receipt, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  paymentReceipt(@Args('shareId') shareId: string) {
    return this.feesService.getReceipt(shareId);
  }

  @Query(() => [ReceiptTemplate])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  receiptTemplates(@CurrentUser() user: AuthUser) {
    return this.feesService.getReceiptTemplates(user.schoolId);
  }

  @Mutation(() => ReceiptTemplate, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canUpdate')
  setDefaultReceiptTemplate(
    @Args('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.setDefaultReceiptTemplate(id, user.schoolId);
  }

  @Mutation(() => ReceiptTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canCreate')
  createReceiptTemplate(
    @Args('name') name: string,
    @Args('templateKey') templateKey: string,
    @Args('thumbnailUrl', { type: () => String, nullable: true })
    thumbnailUrl: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.createReceiptTemplate(
      name,
      templateKey,
      thumbnailUrl,
      user.schoolId,
    );
  }

  // ─── Staff Visibility ──────────────────────────────────────────────────────

  @Query(() => [StaffFeeVisibilityConfig])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, 'canRead')
  staffFeeVisibilityConfigs(@CurrentUser() user: AuthUser) {
    return this.feesService.getVisibilityConfig(user.schoolId);
  }

  @Mutation(() => StaffFeeVisibilityConfig)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission(AppResource.FEES, PermissionAction.CONFIGURE)
  upsertStaffFeeVisibility(
    @Args('input') input: UpdateVisibilityConfigInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feesService.upsertVisibilityConfig(
      input,
      user.schoolId,
      user.sub,
    );
  }
}

// Suppress unused role arrays — they're referenced for documentation/future use
void FINANCE_ROLES;
void STAFF_ROLES;
