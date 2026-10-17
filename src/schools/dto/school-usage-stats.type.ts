import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SchoolUsageStats {
  @Field(() => Int)
  totalStudents: number;

  @Field(() => Int)
  totalStaff: number;

  @Field(() => Int)
  totalGuardians: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  activeUsers: number;
}
