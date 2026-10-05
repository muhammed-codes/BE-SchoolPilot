import { InputType, Field, Float, ID, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import {
  ExpenseRequestType,
  ExpenseRequestStatus,
  ExpenseRequestPaymentStatus,
  ExpensePaymentMethod,
} from '../enums';

@InputType()
export class CreateExpenseRequestInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title!: string;

  @Field(() => ExpenseRequestType, {
    defaultValue: ExpenseRequestType.MATERIALS_PURCHASE,
  })
  @IsEnum(ExpenseRequestType)
  requestType!: ExpenseRequestType;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  estimatedAmount!: number;

  @Field(() => ID)
  @IsUUID()
  categoryId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @Field({ nullable: true })
  @IsOptional()
  neededByDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preferredVendor?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  quotationUrls?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  termId?: string;
}

@InputType()
export class UpdateExpenseRequestInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => ExpenseRequestType, { nullable: true })
  @IsOptional()
  @IsEnum(ExpenseRequestType)
  requestType?: ExpenseRequestType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedAmount?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field({ nullable: true })
  @IsOptional()
  neededByDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preferredVendor?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  quotationUrls?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

@InputType()
export class ApproveExpenseRequestInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  approvedAmount?: number;
}

@InputType()
export class RecordExpenseRequestPaymentInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  amount!: number;
}

@InputType()
export class RejectExpenseRequestInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  rejectionReason!: string;
}

@InputType()
export class ConvertRequestToExpenseInput {
  @Field(() => ID)
  @IsUUID()
  requestId!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  actualAmount!: number;

  @Field()
  @IsNotEmpty()
  expenseDate!: string;

  @Field(() => ExpensePaymentMethod, {
    defaultValue: ExpensePaymentMethod.CASH,
  })
  @IsEnum(ExpensePaymentMethod)
  paymentMethod!: ExpensePaymentMethod;

  @Field(() => ExpenseRequestPaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ExpenseRequestPaymentStatus)
  paymentStatus?: ExpenseRequestPaymentStatus;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class ExpenseRequestFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => ExpenseRequestStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ExpenseRequestStatus)
  status?: ExpenseRequestStatus;

  @Field(() => ExpenseRequestType, { nullable: true })
  @IsOptional()
  @IsEnum(ExpenseRequestType)
  requestType?: ExpenseRequestType;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  @Field({ nullable: true })
  @IsOptional()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
