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
import { RecurringFrequency } from '../enums';

@InputType()
export class CreateRecurringExpenseInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title!: string;

  @Field(() => ID)
  @IsUUID()
  categoryId!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  estimatedAmount!: number;

  @Field(() => RecurringFrequency, { defaultValue: RecurringFrequency.MONTHLY })
  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @Field()
  @IsNotEmpty()
  nextDueDate!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateRecurringExpenseInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedAmount?: number;

  @Field(() => RecurringFrequency, { nullable: true })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @Field({ nullable: true })
  @IsOptional()
  nextDueDate?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
