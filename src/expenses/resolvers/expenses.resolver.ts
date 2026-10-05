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
import { User } from '../../users/entities/user.entity';
import {
  Expense,
  ExpenseCategory,
  ExpenseDepartment,
  ExpenseActivity,
} from '../entities';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  VoidExpenseInput,
  ExpenseFilterInput,
  PaginatedExpenses,
  DuplicateExpenseWarning,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateExpenseDepartmentInput,
} from '../dto';
import { ExpensesService } from '../services/expenses.service';

type CurrentUserPayload = {
  id?: string;
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

const mapToUserEntity = (payload: CurrentUserPayload): User => {
  const user = new User();
  user.id = payload.id || payload.sub;
  user.email = payload.email;
  user.role = payload.role;
  user.schoolId = payload.schoolId;
  return user;
};

@Resolver(() => Expense)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  // ── CATEGORIES ─────────────────────────────────────────────────────────────

  @Query(() => [ExpenseCategory])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseCategories(
    @CurrentUser() user: CurrentUserPayload,
    @Args('includeInactive', { type: () => Boolean, nullable: true })
    includeInactive = false,
  ) {
    return this.expensesService.getCategories(user.schoolId, includeInactive);
  }

  @Mutation(() => ExpenseCategory)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createExpenseCategory(
    @Args('input') input: CreateExpenseCategoryInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.createCategory(input, user.schoolId);
  }

  @Mutation(() => ExpenseCategory)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  updateExpenseCategory(
    @Args('input') input: UpdateExpenseCategoryInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.updateCategory(input, user.schoolId);
  }

  @Mutation(() => ExpenseCategory)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.DELETE)
  deleteExpenseCategory(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.archiveCategory(id, user.schoolId);
  }

  // ── DEPARTMENTS ────────────────────────────────────────────────────────────

  @Query(() => [ExpenseDepartment])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseDepartments(@CurrentUser() user: CurrentUserPayload) {
    return this.expensesService.getDepartments(user.schoolId);
  }

  @Mutation(() => ExpenseDepartment)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createExpenseDepartment(
    @Args('input') input: CreateExpenseDepartmentInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.createDepartment(input, user.schoolId);
  }

  // ── EXPENSES ───────────────────────────────────────────────────────────────

  @Mutation(() => Expense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createExpense(
    @Args('input') input: CreateExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.createExpense(input, mapToUserEntity(user));
  }

  @Mutation(() => Expense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  updateExpense(
    @Args('input') input: UpdateExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.updateExpense(input, mapToUserEntity(user));
  }

  @Mutation(() => Expense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.DELETE)
  voidExpense(
    @Args('input') input: VoidExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.voidExpense(input, mapToUserEntity(user));
  }

  @Query(() => PaginatedExpenses)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenses(
    @Args('filter', { type: () => ExpenseFilterInput, nullable: true })
    filter: ExpenseFilterInput = {},
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.getExpenses(filter, user.schoolId);
  }

  @Query(() => Expense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expense(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.getExpenseById(id, user.schoolId);
  }

  @Query(() => DuplicateExpenseWarning)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  checkDuplicateExpense(
    @Args('input') input: CreateExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.checkDuplicate(input, user.schoolId);
  }

  @Query(() => [ExpenseActivity])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseActivities(
    @Args('expenseId', { type: () => ID }) expenseId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.expensesService.getExpenseActivities(expenseId, user.schoolId);
  }
}
