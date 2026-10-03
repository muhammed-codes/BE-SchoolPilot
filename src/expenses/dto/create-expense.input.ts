import { InputType, Field, Float, ID } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  IsEnum,
  IsString,
} from 'class-validator';
import { ExpensePaymentMethod, ExpensePaymentStatus } from '../enums';

@InputType()
export class CreateExpenseInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @Field()
  @IsNotEmpty()
  expenseDate!: string;

  @Field(() => ID)
  @IsUUID()
  categoryId!: string;

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

  @Field(() => ExpensePaymentMethod, {
    defaultValue: ExpensePaymentMethod.CASH,
  })
  @IsEnum(ExpensePaymentMethod)
  paymentMethod!: ExpensePaymentMethod;

  @Field(() => ExpensePaymentStatus, {
    defaultValue: ExpensePaymentStatus.PAID,
  })
  @IsEnum(ExpensePaymentStatus)
  paymentStatus!: ExpensePaymentStatus;

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

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  recurringExpenseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  termId?: string;
}
