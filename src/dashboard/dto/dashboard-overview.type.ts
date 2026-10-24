import { ObjectType, Field } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';
import { MetricStat } from '../../common/dto/metric-stat.type';

@ObjectType()
export class DashboardOverview {
  @Field(() => MetricStat, { nullable: true })
  studentsCount!: MetricStat | null;

  @Field(() => MetricStat, { nullable: true })
  teachersCount!: MetricStat | null;

  @Field(() => MetricStat, { nullable: true })
  classesCount!: MetricStat | null;

  @Field(() => [Student], { nullable: true })
  recentStudents!: Student[] | null;
}
