import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class StudentStatistics {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  male!: number;

  @Field(() => Int)
  female!: number;

  @Field(() => Int)
  active!: number;
}
