import { ObjectType, Field, Float, ID } from '@nestjs/graphql';
import { ExpenseCategory } from '../entities/expense-category.entity';

@ObjectType()
export class CategoryBudgetProgress {
  @Field(() => ID)
  categoryId!: string;

  @Field(() => ExpenseCategory, { nullable: true })
  category?: ExpenseCategory;

  @Field(() => Float)
  budgetAmount!: number;

  @Field(() => Float)
  actualSpent!: number;

  @Field(() => Float)
  committedAmount!: number;

  @Field(() => Float)
  availableAmount!: number;

  @Field(() => Float)
  percentageUsed!: number;

  @Field()
  warningLevel!: string; // 'NORMAL' | 'WARNING_75' | 'WARNING_90' | 'OVER_BUDGET'
}

@ObjectType()
export class DuplicateExpenseWarning {
  @Field(() => Boolean)
  isPossibleDuplicate!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => ID, { nullable: true })
  matchedExpenseId?: string;

  @Field({ nullable: true })
  matchedExpenseTitle?: string;

  @Field(() => Float, { nullable: true })
  matchedExpenseAmount?: number;

  @Field({ nullable: true })
  matchedExpenseDate?: string;
}
