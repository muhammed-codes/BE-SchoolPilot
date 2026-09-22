import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UseGuards, ForbiddenException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedUser = createPaginatedType(User);

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.READ)
  me(@CurrentUser() user: { sub: string }) {
    return this.usersService.findById(user.sub);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.READ)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => PaginatedUser)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.READ)
  schoolUsers(
    @Args('role', { type: () => UserRole, nullable: true }) role: UserRole,
    @Args('search', { type: () => String, nullable: true }) search: string,
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.usersService.findBySchool(
      user.schoolId,
      role,
      pagination,
      search,
    );
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.READ)
  schoolTeachers(@CurrentUser() user: { schoolId: string }) {
    return this.usersService.findTeachersBySchool(user.schoolId);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.CREATE)
  createUser(
    @Args('input') input: CreateUserInput,
    @CurrentUser() user: { sub: string; role: UserRole; schoolId: string },
  ) {
    const leadershipRoles = [
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ];

    if (leadershipRoles.includes(user.role)) {
      const allowedRoles = [
        UserRole.PRINCIPAL,
        UserRole.VICE_PRINCIPAL,
        UserRole.HEAD_TEACHER,
        UserRole.CLASS_TEACHER,
        UserRole.SUBJECT_TEACHER,
        UserRole.PARENT,
      ];
      if (!allowedRoles.includes(input.role)) {
        throw new ForbiddenException(
          'School leadership can only create staff, teachers, and parents',
        );
      }
      return this.usersService.createUser(input, user.schoolId);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return this.usersService.createUser(
        input,
        input.schoolId || user.schoolId,
      );
    }
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.UPDATE)
  assignUserToSchool(
    @Args('userId') userId: string,
    @Args('schoolId') schoolId: string,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    return this.usersService.assignSchool(
      userId,
      schoolId,
      user.role,
      user.schoolId,
    );
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.UPDATE)
  updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: { sub: string; role: UserRole; schoolId: string },
  ) {
    return this.usersService.updateUser(
      id,
      input,
      user.sub,
      user.role,
      user.schoolId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.UPDATE)
  changePassword(
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.changePassword(user.sub, oldPassword, newPassword);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.UPDATE)
  adminResetPassword(
    @Args('userId') userId: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    return this.usersService.adminResetPassword(
      userId,
      newPassword,
      user.role,
      user.schoolId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  adminResetSchoolPassword(
    @Args('schoolId') schoolId: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() user: { role: UserRole },
  ) {
    return this.usersService.adminResetSchoolPassword(
      schoolId,
      newPassword,
      user.role,
    );
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.CREATE)
  uploadAvatar(
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.updateAvatar(user.sub, imageUrl);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.CREATE)
  uploadUserAvatar(
    @Args('userId') userId: string,
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    return this.usersService.updateUserAvatarByAdmin(
      userId,
      imageUrl,
      user.role,
      user.schoolId,
    );
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, PermissionAction.UPDATE)
  deactivateUser(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole; schoolId: string },
  ) {
    return this.usersService.deactivateUser(
      id,
      user.sub,
      user.role,
      user.schoolId,
    );
  }
}
