import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class SetExpenseBudgetInput {
  @Field(() => ID)
  @IsUUID()
  sessionId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @Field(() => ID)
  @IsUUID()
  categoryId!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  budgetAmount!: number;
}

@InputType()
export class BulkSetExpenseBudgetInput {
  @Field(() => ID)
  @IsUUID()
  sessionId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @Field(() => [CategoryBudgetInput])
  budgets!: CategoryBudgetInput[];
}

@InputType()
export class CategoryBudgetInput {
  @Field(() => ID)
  @IsUUID()
  categoryId!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  budgetAmount!: number;
}
