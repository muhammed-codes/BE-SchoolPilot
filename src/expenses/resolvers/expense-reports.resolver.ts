import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';
import { UserRole } from '../../common/enums/role.enum';
import {
  ExpenseSummary,
  ExpenseBreakdownItem,
  ExpenseMonthlyTrend,
} from '../dto';
import { ExpenseReportsService } from '../services/expense-reports.service';

type CurrentUserPayload = {
  id?: string;
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpenseReportsResolver {
  constructor(private readonly reportsService: ExpenseReportsService) {}

  @Query(() => ExpenseSummary)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseSummary(
    @Args('sessionId', { type: () => ID, nullable: true })
    sessionId: string | undefined,
    @Args('termId', { type: () => ID, nullable: true })
    termId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getSummary(user.schoolId, sessionId, termId);
  }

  @Query(() => [ExpenseBreakdownItem])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseSpendingByCategory(
    @Args('sessionId', { type: () => ID, nullable: true })
    sessionId: string | undefined,
    @Args('termId', { type: () => ID, nullable: true })
    termId: string | undefined,
    @Args('startDate', { nullable: true }) startDate: string | undefined,
    @Args('endDate', { nullable: true }) endDate: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getSpendingByCategory(
      user.schoolId,
      sessionId,
      termId,
      startDate,
      endDate,
    );
  }

  @Query(() => [ExpenseMonthlyTrend])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseMonthlyTrends(
    @Args('year', { type: () => Int, nullable: true }) year: number | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getMonthlyTrends(user.schoolId, year);
  }

  @Query(() => [ExpenseBreakdownItem])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseSpendingByDepartment(
    @Args('sessionId', { type: () => ID, nullable: true })
    sessionId: string | undefined,
    @Args('termId', { type: () => ID, nullable: true })
    termId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getSpendingByDepartment(
      user.schoolId,
      sessionId,
      termId,
    );
  }

  @Query(() => [ExpenseBreakdownItem])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseSpendingByVendor(
    @Args('sessionId', { type: () => ID, nullable: true })
    sessionId: string | undefined,
    @Args('termId', { type: () => ID, nullable: true })
    termId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getSpendingByVendor(
      user.schoolId,
      sessionId,
      termId,
    );
  }
}
