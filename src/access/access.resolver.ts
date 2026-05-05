import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessService } from './access.service';
import { RolePermission } from './entities/role-permission.entity';
import { UpdatePermissionInput } from './dto/update-permission.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Resolver(() => RolePermission)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessResolver {
  constructor(private readonly accessService: AccessService) {}

  @Query(() => [RolePermission], { name: 'myPermissions' })
  getMyPermissions(@Context() context: any) {
    const user = context.req.user;
    return this.accessService.getPermissionsByRole(user.role);
  }

  @Query(() => [RolePermission], { name: 'allRolePermissions' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  getAllPermissions() {
    return this.accessService.getAllPermissions();
  }

  @Mutation(() => RolePermission)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  updateRolePermission(
    @Args('input') input: UpdatePermissionInput,
  ) {
    const updates: Partial<RolePermission> = {};
    if (input.canCreate !== undefined) updates.canCreate = input.canCreate;
    if (input.canRead !== undefined) updates.canRead = input.canRead;
    if (input.canUpdate !== undefined) updates.canUpdate = input.canUpdate;
    if (input.canDelete !== undefined) updates.canDelete = input.canDelete;
    return this.accessService.updateRolePermission(input.id, updates);
  }
}
