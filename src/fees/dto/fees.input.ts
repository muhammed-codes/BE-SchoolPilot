import { InputType, Field, Int } from '@nestjs/graphql';
import { FeeRecurrence } from '../entities/fee-category.entity';
import { FeeOverrideType } from '../entities/student-fee-override.entity';
import { ApprovalMode } from '../entities/fee-approval-config.entity';
import { ApproverType } from '../entities/fee-approval-step.entity';

@InputType()
export class CreateFeeCategoryInput {
  @Field()
  name!: string;

  @Field(() => FeeRecurrence, { nullable: true })
  recurrence?: FeeRecurrence;
}

@InputType()
export class UpdateFeeCategoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => FeeRecurrence, { nullable: true })
  recurrence?: FeeRecurrence;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class CreateFeeStructureInput {
  @Field()
  feeCategoryId!: string;

  @Field(() => String, { nullable: true })
  classId?: string;

  @Field()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  termId?: string;

  @Field(() => Int)
  amount!: number;
}

@InputType()
export class BulkCreateFeeStructureInput {
  @Field()
  feeCategoryId!: string;

  @Field(() => [String])
  classIds!: string[];

  @Field()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  termId?: string;

  @Field(() => Int)
  amount!: number;
}

@InputType()
export class BulkCreateOverrideInput {
  @Field()
  feeStructureId!: string;

  @Field(() => [String])
  studentIds!: string[];

  @Field(() => Int)
  overrideAmount!: number;

  @Field({ nullable: true })
  reason?: string;

  @Field(() => FeeOverrideType, { nullable: true })
  type?: FeeOverrideType;
}

@InputType()
export class CreateBankAccountInput {
  @Field()
  bankName!: string;

  @Field()
  accountNumber!: string;

  @Field()
  accountName!: string;

  @Field(() => String, { nullable: true })
  feeCategoryId?: string;
}

@InputType()
export class UpdateBankAccountInput {
  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  accountName?: string;

  @Field(() => String, { nullable: true })
  feeCategoryId?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class GenerateInvoicesInput {
  @Field()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  termId?: string;

  /** If true and invoices already exist for the term, void them and regenerate */
  @Field({ nullable: true })
  forceRegenerate?: boolean;
}

@InputType()
export class PaymentAllocationInput {
  @Field(() => String, { nullable: true })
  studentInvoiceItemId?: string;

  @Field(() => Int)
  amount!: number;
}

@InputType()
export class PaymentStudentShareInput {
  @Field()
  studentId!: string;

  @Field(() => Int)
  amount!: number;

  @Field(() => [PaymentAllocationInput], { nullable: true })
  allocations?: PaymentAllocationInput[];
}

@InputType()
export class SubmitPaymentBatchInput {
  @Field()
  proofUrl!: string;

  @Field()
  proofType!: string;

  @Field(() => String, { nullable: true })
  bankAccountId?: string;

  @Field(() => Int)
  totalAmount!: number;

  @Field({ nullable: true })
  note?: string;

  @Field(() => [PaymentStudentShareInput])
  shares!: PaymentStudentShareInput[];
}

@InputType()
export class ApproveShareInput {
  @Field()
  shareId!: string;

  @Field(() => [PaymentAllocationInput], { nullable: true })
  allocations?: PaymentAllocationInput[];
}

@InputType()
export class RejectShareInput {
  @Field()
  shareId!: string;

  @Field()
  reason!: string;
}

@InputType()
export class ApprovalStepInput {
  @Field(() => Int)
  sequenceOrder!: number;

  @Field(() => ApproverType)
  approverType!: ApproverType;

  @Field(() => String, { nullable: true })
  approverId?: string;

  @Field(() => String, { nullable: true })
  approverRole?: string;
}

@InputType()
export class UpsertApprovalConfigInput {
  @Field(() => String, { nullable: true })
  feeCategoryId?: string;

  @Field(() => ApprovalMode)
  mode!: ApprovalMode;

  @Field(() => [ApprovalStepInput])
  steps!: ApprovalStepInput[];
}

@InputType()
export class UpdateVisibilityConfigInput {
  @Field()
  role!: string;

  @Field()
  canViewPaymentRecords!: boolean;
}
