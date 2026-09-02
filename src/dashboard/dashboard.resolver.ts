import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';
import { DashboardService } from './dashboard.service';
import { DashboardOverview } from './dto/dashboard-overview.type';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardOverview)
  @UseGuards(JwtAuthGuard)
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
