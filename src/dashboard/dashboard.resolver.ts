import { Resolver, Query, Args } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UserRole } from '../common/enums';
import { TEACHER_ROLES } from '../common/constants/roles.constant';
import { AccessService } from '../access/access.service';
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
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly accessService: AccessService,
  ) {}

  private assertSchoolwideDashboardRole(role: UserRole) {
    if (TEACHER_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Schoolwide dashboard analytics are not available to teacher accounts',
      );
    }
  }

  @Query(() => DashboardAnalytics, {
    description:
      'Fetches comprehensive real-time dashboard analytics for school administrators',
  })
  @UseGuards(JwtAuthGuard)
  dashboardAnalytics(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('input', { nullable: true }) input?: DashboardAnalyticsInput,
  ): Promise<DashboardAnalytics> {
    const permissions = this.accessService.getEffectivePermissions(
      user.sub,
      user.role,
      user.schoolId,
    );
    return permissions.then((effective) => {
      const readableResources = TEACHER_ROLES.includes(user.role)
        ? new Set<AppResource>()
        : new Set(
            effective
              .filter(
                (permission) =>
                  permission.action === PermissionAction.READ &&
                  permission.allowed,
              )
              .map((permission) => permission.resource),
          );
      return this.dashboardService.getDashboardAnalytics(
        user.schoolId,
        input || {},
        readableResources,
      );
    });
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
    this.assertSchoolwideDashboardRole(user.role);
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
    this.assertSchoolwideDashboardRole(user.role);
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
    return this.accessService
      .getEffectivePermissions(user.sub, user.role, user.schoolId)
      .then(async (effective) => {
        const canRead = (resource: AppResource) =>
          effective.some(
            (permission) =>
              permission.resource === resource &&
              permission.action === PermissionAction.READ &&
              permission.allowed,
          );
        const overview = await this.dashboardService.getDashboardOverview(
          user.sub,
          user.schoolId,
          user.role,
        );
        const filtered: DashboardOverview = {
          studentsCount: canRead(AppResource.STUDENTS)
            ? overview.studentsCount
            : null,
          teachersCount: canRead(AppResource.USERS)
            ? overview.teachersCount
            : null,
          classesCount: canRead(AppResource.CLASSES)
            ? overview.classesCount
            : null,
          recentStudents: canRead(AppResource.STUDENTS)
            ? overview.recentStudents
            : null,
        };
        return filtered;
      });
  }
}
