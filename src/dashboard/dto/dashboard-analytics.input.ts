import { InputType, Field, registerEnumType } from '@nestjs/graphql';

export enum DashboardTimeFilter {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  TERM = 'TERM',
  YEAR = 'YEAR',
}

registerEnumType(DashboardTimeFilter, {
  name: 'DashboardTimeFilter',
  description: 'Time filter period for dashboard metrics',
});

export enum AttendancePeriodFilter {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(AttendancePeriodFilter, {
  name: 'AttendancePeriodFilter',
  description: 'Time filter period for attendance analytics',
});

@InputType()
export class DashboardAnalyticsInput {
  @Field(() => DashboardTimeFilter, {
    nullable: true,
    defaultValue: DashboardTimeFilter.MONTH,
  })
  incomeTimeFilter?: DashboardTimeFilter;

  @Field(() => AttendancePeriodFilter, {
    nullable: true,
    defaultValue: AttendancePeriodFilter.WEEK,
  })
  attendanceTimeFilter?: AttendancePeriodFilter;

  @Field(() => String, { nullable: true })
  sessionId?: string;

  @Field(() => String, { nullable: true })
  termId?: string;
}
