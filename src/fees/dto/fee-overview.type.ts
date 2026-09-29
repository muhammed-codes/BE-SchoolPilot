import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ClassFeeSummary {
  @Field()
  classId!: string;

  @Field()
  className!: string;

  @Field(() => Int)
  totalStudents!: number;

  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalPaid!: number;

  @Field(() => Int)
  totalOutstanding!: number;

  @Field(() => Int)
  paidCount!: number;

  @Field(() => Int)
  partiallyPaidCount!: number;

  @Field(() => Int)
  openCount!: number;
}

@ObjectType()
export class FeeOverview {
  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalCollected!: number;

  @Field(() => Int)
  totalOutstanding!: number;

  @Field(() => Int)
  paidInvoicesCount!: number;

  @Field(() => Int)
  partiallyPaidInvoicesCount!: number;

  @Field(() => Int)
  openInvoicesCount!: number;

  @Field(() => [ClassFeeSummary])
  classSummaries!: ClassFeeSummary[];
}
