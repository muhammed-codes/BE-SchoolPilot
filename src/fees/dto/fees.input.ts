import { InputType, Field, Int } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FeeRecurrence } from '../entities/fee-category.entity';
import { FeeOverrideType } from '../entities/student-fee-override.entity';
import { ApprovalMode } from '../entities/fee-approval-config.entity';
import { ApproverType } from '../entities/fee-approval-step.entity';

@InputType()
export class CreateFeeCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => FeeRecurrence, { nullable: true })
  @IsOptional()
  @IsEnum(FeeRecurrence)
  recurrence?: FeeRecurrence;
}

@InputType()
export class UpdateFeeCategoryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field(() => FeeRecurrence, { nullable: true })
  @IsOptional()
  @IsEnum(FeeRecurrence)
  recurrence?: FeeRecurrence;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class CreateFeeStructureInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  feeCategoryId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  classId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  termId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  amount!: number;
}

@InputType()
export class BulkCreateFeeStructureInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  feeCategoryId!: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  classIds!: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  termId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  amount!: number;
}

@InputType()
export class BulkCreateOverrideInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  feeStructureId!: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  studentIds!: string[];

  @Field(() => Int)
  @IsInt()
  @Min(1)
  overrideAmount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field(() => FeeOverrideType, { nullable: true })
  @IsOptional()
  @IsEnum(FeeOverrideType)
  type?: FeeOverrideType;
}

@InputType()
export class CreateBankAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  accountName!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  feeCategoryId?: string;
}

@InputType()
export class UpdateBankAccountInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  feeCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class GenerateInvoicesInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  termId?: string;

  /** If true and invoices already exist for the term, void them and regenerate */
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}

@InputType()
export class PaymentAllocationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  studentInvoiceItemId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  amount!: number;
}

@InputType()
export class PaymentStudentShareInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  amount!: number;

  @Field(() => [PaymentAllocationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  allocations?: PaymentAllocationInput[];
}

@InputType()
export class SubmitPaymentBatchInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  proofUrl!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  proofType!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  totalAmount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;

  @Field(() => [PaymentStudentShareInput])
  @IsArray()
  @ArrayNotEmpty()
  shares!: PaymentStudentShareInput[];
}

@InputType()
export class ApproveShareInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  shareId!: string;

  @Field(() => [PaymentAllocationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  allocations?: PaymentAllocationInput[];
}

@InputType()
export class RejectShareInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  shareId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

@InputType()
export class ApprovalStepInput {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  sequenceOrder!: number;

  @Field(() => ApproverType)
  @IsEnum(ApproverType)
  approverType!: ApproverType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  approverId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  approverRole?: string;
}

@InputType()
export class UpsertApprovalConfigInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  feeCategoryId?: string;

  @Field(() => ApprovalMode)
  @IsEnum(ApprovalMode)
  mode!: ApprovalMode;

  @Field(() => [ApprovalStepInput])
  @IsArray()
  @ArrayNotEmpty()
  steps!: ApprovalStepInput[];
}

@InputType()
export class UpdateVisibilityConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  role!: string;

  @Field()
  @IsBoolean()
  canViewPaymentRecords!: boolean;
}
