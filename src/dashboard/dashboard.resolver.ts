import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
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
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles(...Object.values(UserRole).filter((role) => role !== UserRole.PARENT))
  dashboardAnalytics(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DashboardAnalytics> {
    return this.dashboardService.getDashboardAnalytics(
      user.schoolId,
      input || {},
      user,
    );
  }

  @Query(() => DashboardIncomeAnalytics, {
    description:
      'Fetches filtered income trend analytics for the specified time period',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
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
    if (user.role === UserRole.PARENT)
      throw new ForbiddenException('Use linked-child fees');
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
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
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
    if (
      [
        UserRole.CLASS_TEACHER,
        UserRole.SUBJECT_TEACHER,
        UserRole.PARENT,
      ].includes(user.role)
    )
      throw new ForbiddenException('Use assigned-record attendance');
    return this.dashboardService.getDashboardAttendanceAnalytics(
      user.schoolId,
      filter,
      termId,
    );
  }

  @Query(() => DashboardOverview)
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
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
