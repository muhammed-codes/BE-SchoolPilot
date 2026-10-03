import { InputType, Field, Float, ID } from '@nestjs/graphql';
import {
  IsOptional,
  IsNumber,
  IsPositive,
  IsUUID,
  IsEnum,
  IsString,
} from 'class-validator';
import { ExpensePaymentMethod, ExpensePaymentStatus } from '../enums';

@InputType()
export class UpdateExpenseInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @Field({ nullable: true })
  @IsOptional()
  expenseDate?: string;

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
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @Field(() => ExpensePaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @Field(() => ExpensePaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ExpensePaymentStatus)
  paymentStatus?: ExpensePaymentStatus;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  amountPaid?: number;

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

  @Field({ nullable: true })
  @IsOptional()
  dueDate?: string;
}

@InputType()
export class VoidExpenseInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
