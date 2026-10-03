import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
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
import { PettyCashAccount, PettyCashTransaction } from '../entities';
import { ReplenishPettyCashInput } from '../dto';
import { PettyCashService } from '../services/petty-cash.service';

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

@Resolver(() => PettyCashAccount)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class PettyCashResolver {
  constructor(private readonly pettyCashService: PettyCashService) {}

  @Query(() => PettyCashAccount)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  pettyCashAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.pettyCashService.getAccount(user.schoolId);
  }

  @Mutation(() => PettyCashTransaction)
  @RequirePermission(AppResource.EXPENSES, PermissionAction.CREATE)
  replenishPettyCash(
    @Args('input') input: ReplenishPettyCashInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.pettyCashService.replenish(input, mapToUserEntity(user));
  }

  @Query(() => [PettyCashTransaction])
  @RequirePermission(AppResource.EXPENSES, PermissionAction.READ)
  pettyCashTransactions(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.pettyCashService.getTransactions(user.schoolId, limit);
  }
}
