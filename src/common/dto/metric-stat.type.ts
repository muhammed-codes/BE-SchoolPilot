import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class MetricStat {
  @Field(() => String) // 'ready' | 'no_active_term' | 'empty'
  status!: string;

  @Field(() => Int, { nullable: true })
  value?: number;

  @Field(() => Int, { nullable: true })
  total?: number;

  @Field(() => String, { nullable: true })
  delta?: string;
}

export function createMetricStat(
  value: number | undefined | null,
  total?: number | null,
  delta?: string | null,
  hasActiveTerm: boolean = true,
): MetricStat {
  if (!hasActiveTerm) {
    return { status: 'no_active_term' };
  }
  if (value === undefined || value === null || value === 0) {
    return { status: 'empty', value: 0 };
  }
  const stat: MetricStat = {
    status: 'ready',
    value,
  };
  if (total !== undefined && total !== null && total > 0) {
    stat.total = total;
  }
  if (delta !== undefined && delta !== null && delta !== '') {
    stat.delta = delta;
  }
  return stat;
}
