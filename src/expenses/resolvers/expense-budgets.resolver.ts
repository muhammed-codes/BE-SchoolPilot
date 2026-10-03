import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';
import { UserRole } from '../../common/enums/role.enum';
import { ExpenseBudget } from '../entities';
import {
  SetExpenseBudgetInput,
  BulkSetExpenseBudgetInput,
  CategoryBudgetProgress,
} from '../dto';
import { ExpenseBudgetsService } from '../services/expense-budgets.service';

type CurrentUserPayload = {
  id?: string;
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

@Resolver(() => ExpenseBudget)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpenseBudgetsResolver {
  constructor(private readonly budgetsService: ExpenseBudgetsService) {}

  @Mutation(() => ExpenseBudget)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  setExpenseBudget(
    @Args('input') input: SetExpenseBudgetInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.setBudget(input, user.schoolId);
  }

  @Mutation(() => [ExpenseBudget])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  bulkSetExpenseBudgets(
    @Args('input') input: BulkSetExpenseBudgetInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.bulkSetBudgets(input, user.schoolId);
  }

  @Query(() => [CategoryBudgetProgress])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseBudgets(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('termId', { type: () => ID, nullable: true })
    termId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.getBudgets(sessionId, termId, user.schoolId);
  }
}
