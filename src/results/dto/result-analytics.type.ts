import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class GradeDistributionItem {
  @Field()
  grade: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class ResultAnalytics {
  @Field(() => Float)
  classAverage: number;

  @Field(() => Float)
  passRate: number;

  @Field(() => Float)
  highestScore: number;

  @Field(() => Float)
  lowestScore: number;

  @Field(() => Int)
  assessedCount: number;

  @Field(() => Int)
  passedCount: number;

  @Field(() => [GradeDistributionItem])
  gradeDistribution: GradeDistributionItem[];

  @Field(() => Float, { nullable: true })
  deltaPreviousTerm?: number | null;
}
