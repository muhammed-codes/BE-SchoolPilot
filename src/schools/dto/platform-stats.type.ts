import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalSchools: number;

  @Field(() => Int)
  activeSchools: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Int)
  totalStaff: number;

  @Field(() => Int)
  totalGuardians: number;

  @Field(() => Int)
  pendingSchools: number;

  @Field(() => Int)
  suspendedSchools: number;

  @Field(() => Int)
  rejectedSchools: number;

  @Field(() => Int)
  inactiveSchools: number;

  @Field(() => Int)
  schoolsAddedThisMonth: number;

  @Field(() => Int)
  studentsAddedThisMonth: number;

  @Field(() => Int)
  staffAddedThisMonth: number;
}
