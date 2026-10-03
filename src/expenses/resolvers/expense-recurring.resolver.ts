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
import { RecurringExpense } from '../entities';
import {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../dto';
import { ExpenseRecurringService } from '../services/expense-recurring.service';

type CurrentUserPayload = {
  id?: string;
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

@Resolver(() => RecurringExpense)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpenseRecurringResolver {
  constructor(private readonly recurringService: ExpenseRecurringService) {}

  @Query(() => [RecurringExpense])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  recurringExpenses(@CurrentUser() user: CurrentUserPayload) {
    return this.recurringService.getRecurringExpenses(user.schoolId);
  }

  @Mutation(() => RecurringExpense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createRecurringExpense(
    @Args('input') input: CreateRecurringExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recurringService.createRecurringExpense(input, user.schoolId);
  }

  @Mutation(() => RecurringExpense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  updateRecurringExpense(
    @Args('input') input: UpdateRecurringExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recurringService.updateRecurringExpense(input, user.schoolId);
  }

  @Mutation(() => RecurringExpense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  markRecurringExpenseRecorded(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recurringService.markRecorded(id, user.schoolId);
  }
}
