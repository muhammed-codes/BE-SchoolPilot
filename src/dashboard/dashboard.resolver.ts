import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UserRole } from '../common/enums';
import { DashboardService } from './dashboard.service';
import { DashboardOverview } from './dto/dashboard-overview.type';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

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
