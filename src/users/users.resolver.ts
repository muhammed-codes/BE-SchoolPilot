import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards, ForbiddenException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { SCHOOL_STAFF_ROLES } from '../common/constants/roles.constant';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedUser = createPaginatedType(User);

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canRead')
  me(@CurrentUser() user: { sub: string }) {
    return this.usersService.findById(user.sub);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canRead')
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => PaginatedUser)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canRead')
  schoolUsers(
    @Args('role', { type: () => UserRole, nullable: true }) role: UserRole,
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.usersService.findBySchool(user.schoolId, role, pagination);
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canRead')
  schoolTeachers(@CurrentUser() user: { schoolId: string }) {
    return this.usersService.findTeachersBySchool(user.schoolId);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canCreate')
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
  @RequirePermission(AppResource.USERS, 'canUpdate')
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
  @RequirePermission(AppResource.USERS, 'canUpdate')
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
  @RequirePermission(AppResource.USERS, 'canUpdate')
  changePassword(
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.changePassword(user.sub, oldPassword, newPassword);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canUpdate')
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
  @RequirePermission(AppResource.USERS, 'canCreate')
  uploadAvatar(
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.updateAvatar(user.sub, imageUrl);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.USERS, 'canCreate')
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
  @RequirePermission(AppResource.USERS, 'canUpdate')
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
