import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UserRole } from '../common/enums';
import { DashboardService } from './dashboard.service';
import { DashboardOverview } from './dto/dashboard-overview.type';
import {
  DashboardAnalytics,
  DashboardIncomeAnalytics,
  DashboardAttendanceAnalytics,
} from './dto/dashboard-analytics.type';
import {
  DashboardAnalyticsInput,
  DashboardTimeFilter,
  AttendancePeriodFilter,
} from './dto/dashboard-analytics.input';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardAnalytics, {
    description:
      'Fetches comprehensive real-time dashboard analytics for school administrators',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  dashboardAnalytics(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DashboardAnalytics> {
    return this.dashboardService.getDashboardAnalytics(
      user.schoolId,
      input || {},
    );
  }

  @Query(() => DashboardIncomeAnalytics, {
    description:
      'Fetches filtered income trend analytics for the specified time period',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.FEES, PermissionAction.READ)
  dashboardIncomeAnalytics(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('filter', {
      type: () => DashboardTimeFilter,
      nullable: true,
      defaultValue: DashboardTimeFilter.MONTH,
    })
    filter: DashboardTimeFilter = DashboardTimeFilter.MONTH,
    @Args('termId', { type: () => String, nullable: true })
    termId?: string,
  ): Promise<DashboardIncomeAnalytics> {
    return this.dashboardService.getDashboardIncomeAnalytics(
      user.schoolId,
      filter,
      termId,
    );
  }

  @Query(() => DashboardAttendanceAnalytics, {
    description:
      'Fetches filtered attendance analytics for the specified period',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, PermissionAction.READ)
  dashboardAttendanceAnalytics(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('filter', {
      type: () => AttendancePeriodFilter,
      nullable: true,
      defaultValue: AttendancePeriodFilter.WEEK,
    })
    filter: AttendancePeriodFilter = AttendancePeriodFilter.WEEK,
    @Args('termId', { type: () => String, nullable: true })
    termId?: string,
  ): Promise<DashboardAttendanceAnalytics> {
    return this.dashboardService.getDashboardAttendanceAnalytics(
      user.schoolId,
      filter,
      termId,
    );
  }

  @Query(() => DashboardOverview)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  dashboardOverview(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    return this.dashboardService.getDashboardOverview(
      user.sub,
      user.schoolId,
      user.role,
    );
  }
}
