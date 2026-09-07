import { ObjectType, Field } from '@nestjs/graphql';
import { MetricStat } from '../../common/dto/metric-stat.type';

@ObjectType()
export class ResultStats {
  @Field(() => MetricStat)
  totalSheets!: MetricStat;

  @Field(() => MetricStat)
  pendingSheets!: MetricStat;

  @Field(() => MetricStat)
  approvedSheets!: MetricStat;
}
