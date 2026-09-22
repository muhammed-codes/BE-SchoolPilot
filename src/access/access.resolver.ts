import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AccessService } from './access.service';
import { RolePermission } from './entities/role-permission.entity';
import { UpdatePermissionInput } from './dto/update-permission.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators';
import {
  AssignPermissionGroupInput,
  CreatePermissionGroupInput,
  SetPermissionGroupPermissionsInput,
  SetUserPermissionInput,
  UpdatePermissionGroupInput,
} from './dto/permission-group.input';
import { PermissionGroup } from './entities/permission-group.entity';
import { PermissionGroupPermission } from './entities/permission-group-permission.entity';
import { UserPermissionGroup } from './entities/user-permission-group.entity';
import { UserPermission } from './entities/user-permission.entity';
import { PermissionAction } from './enums/permission-action.enum';
import { AppResource } from './enums/resource.enum';

@Resolver(() => RolePermission)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessResolver {
  constructor(private readonly accessService: AccessService) {}

  private schoolIdFor(
    user: { role: UserRole; schoolId?: string },
    requestedSchoolId?: string,
  ) {
    const schoolId = user.role === UserRole.SUPER_ADMIN ? requestedSchoolId : user.schoolId;
    if (!schoolId) throw new Error('A school scope is required');
    return schoolId;
  }

  @Query(() => [RolePermission], { name: 'myPermissions' })
  getMyPermissions(@CurrentUser() user: { role: UserRole; schoolId?: string }) {
    return this.accessService.getPermissionsByRole(user.role, user.schoolId);
  }

  @Query(() => [RolePermission], { name: 'allRolePermissions' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  getAllPermissions(
    @CurrentUser() user: { role: UserRole; schoolId?: string },
  ) {
    // SUPER_ADMIN sees global permissions; SCHOOL_ADMIN sees their school's permissions
    const schoolId = user.role === UserRole.SUPER_ADMIN ? null : user.schoolId;
    return this.accessService.getAllPermissions(schoolId);
  }

  @Mutation(() => RolePermission)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  updateRolePermission(
    @Args('input') input: UpdatePermissionInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
  ) {
    const updates: Partial<RolePermission> = {};
    if (input.canCreate !== undefined) updates.canCreate = input.canCreate;
    if (input.canRead !== undefined) updates.canRead = input.canRead;
    if (input.canUpdate !== undefined) updates.canUpdate = input.canUpdate;
    if (input.canDelete !== undefined) updates.canDelete = input.canDelete;
    return this.accessService.updateRolePermission(
      input.id,
      updates,
      user.role,
      user.schoolId,
    );
  }

  @Query(() => [PermissionGroup], { name: 'permissionGroups' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  permissionGroups(
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.getPermissionGroups(this.schoolIdFor(user, schoolId));
  }

  @Query(() => [PermissionGroupPermission], { name: 'permissionGroupPermissions' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  permissionGroupPermissions(
    @Args('groupId') groupId: string,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.getPermissionGroupPermissions(groupId, this.schoolIdFor(user, schoolId));
  }

  @Query(() => [UserPermissionGroup], { name: 'userPermissionGroups' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  userPermissionGroups(
    @Args('userId') userId: string,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.getUserPermissionGroups(userId, this.schoolIdFor(user, schoolId));
  }

  @Query(() => [UserPermission], { name: 'userPermissionOverrides' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  userPermissionOverrides(
    @Args('userId') userId: string,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.getUserPermissionOverrides(userId, this.schoolIdFor(user, schoolId));
  }

  @Mutation(() => PermissionGroup)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  createPermissionGroup(
    @Args('input') input: CreatePermissionGroupInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
  ) {
    return this.accessService.createPermissionGroup(input, this.schoolIdFor(user, input.schoolId));
  }

  @Mutation(() => PermissionGroup)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  updatePermissionGroup(
    @Args('input') input: UpdatePermissionGroupInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.updatePermissionGroup(input, this.schoolIdFor(user, schoolId));
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  deletePermissionGroup(
    @Args('groupId') groupId: string,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.deletePermissionGroup(groupId, this.schoolIdFor(user, schoolId));
  }

  @Mutation(() => [PermissionGroupPermission])
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  setPermissionGroupPermissions(
    @Args('input') input: SetPermissionGroupPermissionsInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.setPermissionGroupPermissions(
      input.groupId,
      input.permissions,
      this.schoolIdFor(user, schoolId),
    );
  }

  @Mutation(() => UserPermissionGroup)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  assignPermissionGroup(
    @Args('input') input: AssignPermissionGroupInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    const scope = this.schoolIdFor(user, schoolId);
    return this.accessService.assignPermissionGroup(input.userId, input.groupId, scope);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  removePermissionGroup(
    @Args('userId') userId: string,
    @Args('groupId') groupId: string,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.removePermissionGroup(
      userId,
      groupId,
      this.schoolIdFor(user, schoolId),
    );
  }

  @Mutation(() => UserPermission)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  setUserPermission(
    @Args('input') input: SetUserPermissionInput,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.setUserPermission(input, this.schoolIdFor(user, schoolId));
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  removeUserPermission(
    @Args('userId') userId: string,
    @Args('resource', { type: () => AppResource }) resource: AppResource,
    @Args('action', { type: () => PermissionAction }) action: PermissionAction,
    @CurrentUser() user: { role: UserRole; schoolId?: string },
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string,
  ) {
    return this.accessService.removeUserPermission(
      userId,
      resource,
      action,
      this.schoolIdFor(user, schoolId),
    );
  }
}
