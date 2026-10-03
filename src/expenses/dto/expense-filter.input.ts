import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { ExpensePaymentMethod, ExpensePaymentStatus } from '../enums';

@InputType()
export class ExpenseFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

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

  @Field(() => ExpensePaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @Field(() => ExpensePaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ExpensePaymentStatus)
  paymentStatus?: ExpensePaymentStatus;

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

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  includeVoided?: boolean;

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
