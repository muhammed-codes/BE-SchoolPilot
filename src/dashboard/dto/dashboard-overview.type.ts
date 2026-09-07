import { ObjectType, Field } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';
import { MetricStat } from '../../common/dto/metric-stat.type';

@ObjectType()
export class DashboardOverview {
  @Field(() => MetricStat)
  studentsCount!: MetricStat;

  @Field(() => MetricStat)
  teachersCount!: MetricStat;

  @Field(() => MetricStat)
  classesCount!: MetricStat;

  @Field(() => [Student])
  recentStudents!: Student[];
}
