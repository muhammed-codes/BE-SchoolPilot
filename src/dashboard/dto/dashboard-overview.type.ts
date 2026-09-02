import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
export class DashboardOverview {
  @Field(() => Int)
  studentsCount: number;

  @Field(() => Int)
  teachersCount: number;

  @Field(() => Int)
  classesCount: number;

  @Field(() => [Student])
  recentStudents: Student[];
}
