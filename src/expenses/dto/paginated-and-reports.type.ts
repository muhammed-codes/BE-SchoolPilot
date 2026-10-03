import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Expense } from '../entities/expense.entity';
import { ExpenseRequest } from '../entities/expense-request.entity';

@ObjectType()
export class PaginatedExpenses {
  @Field(() => [Expense])
  items!: Expense[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => Float)
  totalAmount!: number;
}

@ObjectType()
export class PaginatedExpenseRequests {
  @Field(() => [ExpenseRequest])
  items!: ExpenseRequest[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => Float)
  totalEstimatedAmount!: number;
}

@ObjectType()
export class ExpenseBreakdownItem {
  @Field()
  key!: string;

  @Field()
  label!: string;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  percentage!: number;
}

@ObjectType()
export class ExpenseMonthlyTrend {
  @Field()
  month!: string; // e.g. "2026-09"

  @Field()
  label!: string; // e.g. "Sep 2026"

  @Field(() => Float)
  totalSpent!: number;

  @Field(() => Int)
  expenseCount!: number;
}
