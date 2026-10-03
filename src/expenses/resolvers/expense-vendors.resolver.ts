import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';
import { UserRole } from '../../common/enums/role.enum';
import { ExpenseVendor } from '../entities';
import { CreateExpenseVendorInput, UpdateExpenseVendorInput } from '../dto';
import { ExpenseVendorsService } from '../services/expense-vendors.service';

type CurrentUserPayload = {
  id?: string;
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

@Resolver(() => ExpenseVendor)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpenseVendorsResolver {
  constructor(private readonly vendorsService: ExpenseVendorsService) {}

  @Query(() => [ExpenseVendor])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseVendors(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorsService.getVendors(user.schoolId);
  }

  @Mutation(() => ExpenseVendor)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createExpenseVendor(
    @Args('input') input: CreateExpenseVendorInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.vendorsService.createVendor(input, user.schoolId);
  }

  @Mutation(() => ExpenseVendor)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  updateExpenseVendor(
    @Args('input') input: UpdateExpenseVendorInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.vendorsService.updateVendor(input, user.schoolId);
  }

  @Query(() => Float)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseVendorSpend(
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.vendorsService.getVendorTotalSpend(vendorId, user.schoolId);
  }
}
