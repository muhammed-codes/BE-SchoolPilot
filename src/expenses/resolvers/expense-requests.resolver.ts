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
import { ExpenseRequest, Expense, ExpenseActivity } from '../entities';
import {
  CreateExpenseRequestInput,
  UpdateExpenseRequestInput,
  ApproveExpenseRequestInput,
  RecordExpenseRequestPaymentInput,
  RejectExpenseRequestInput,
  ConvertRequestToExpenseInput,
  ExpenseRequestFilterInput,
  PaginatedExpenseRequests,
} from '../dto';
import { ExpenseRequestsService } from '../services/expense-requests.service';

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

@Resolver(() => ExpenseRequest)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class ExpenseRequestsResolver {
  constructor(private readonly requestsService: ExpenseRequestsService) {}

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  createExpenseRequest(
    @Args('input') input: CreateExpenseRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.createRequest(input, mapToUserEntity(user));
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  updateExpenseRequest(
    @Args('input') input: UpdateExpenseRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.updateRequest(input, mapToUserEntity(user));
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.APPROVE)
  approveExpenseRequest(
    @Args('input') input: ApproveExpenseRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.approveRequest(input, mapToUserEntity(user));
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.APPROVE)
  rejectExpenseRequest(
    @Args('input') input: RejectExpenseRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.rejectRequest(input, mapToUserEntity(user));
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  fundExpenseRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.fundRequest(id, mapToUserEntity(user));
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  recordExpenseRequestPayment(
    @Args('input') input: RecordExpenseRequestPaymentInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.recordRequestPayment(
      input.id,
      input.amount,
      mapToUserEntity(user),
    );
  }

  @Mutation(() => Expense)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  convertRequestToExpense(
    @Args('input') input: ConvertRequestToExpenseInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.convertRequestToExpense(
      input,
      mapToUserEntity(user),
    );
  }

  @Mutation(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.UPDATE)
  cancelExpenseRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.cancelRequest(id, mapToUserEntity(user));
  }

  @Query(() => PaginatedExpenseRequests)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseRequests(
    @Args('filter', { type: () => ExpenseRequestFilterInput, nullable: true })
    filter: ExpenseRequestFilterInput = {},
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.getRequests(
      filter,
      user.schoolId,
      mapToUserEntity(user),
    );
  }

  @Query(() => ExpenseRequest)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.getRequestById(id, user.schoolId);
  }

  @Query(() => [ExpenseActivity])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  expenseRequestActivities(
    @Args('requestId', { type: () => ID }) requestId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.requestsService.getRequestActivities(requestId, user.schoolId);
  }
}
