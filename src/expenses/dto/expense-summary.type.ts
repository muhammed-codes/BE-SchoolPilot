import { ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class ExpenseSummary {
  @Field(() => Float)
  totalSpent!: number;

  @Field(() => Int)
  pendingRequestsCount!: number;

  @Field(() => Float)
  pendingRequestsAmount!: number;

  @Field(() => Int)
  unpaidExpensesCount!: number;

  @Field(() => Float)
  unpaidExpensesAmount!: number;

  @Field(() => Float)
  totalBudget!: number;

  @Field(() => Float)
  totalBudgetRemaining!: number;

  @Field(() => Float)
  totalCommitted!: number;

  @Field(() => Int)
  overBudgetCount!: number;

  @Field(() => [NeedsAttentionItem])
  needsAttention!: NeedsAttentionItem[];
}

@ObjectType()
export class NeedsAttentionItem {
  @Field(() => ID)
  id!: string;

  @Field()
  type!: string; // 'PENDING_REQUEST' | 'PENDING_REIMBURSEMENT' | 'UNPAID_EXPENSE' | 'BUDGET_OVERRUN' | 'RECURRING_DUE'

  @Field()
  title!: string;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  date?: string;

  @Field({ nullable: true })
  severity?: string; // 'info' | 'warning' | 'danger'
}
