import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedUser = createPaginatedType(User);

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.usersService.findById(user.sub);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => PaginatedUser)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  schoolUsers(
    @Args('role', { type: () => UserRole, nullable: true }) role: UserRole,
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.usersService.findBySchool(user.schoolId, role, pagination);
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  schoolTeachers(@CurrentUser() user: { schoolId: string }) {
    return this.usersService.findTeachersBySchool(user.schoolId);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  createUser(
    @Args('input') input: CreateUserInput,
    @CurrentUser() user: { sub: string; role: string; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN) {
      const allowedRoles = [
        UserRole.CLASS_TEACHER,
        UserRole.SUBJECT_TEACHER,
        UserRole.PARENT,
      ];
      if (!allowedRoles.includes(input.role)) {
        throw new ForbiddenException(
          'School admins can only create teachers and parents',
        );
      }
      return this.usersService.createUser(input, user.schoolId);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      if (input.role !== UserRole.SCHOOL_ADMIN) {
        throw new ForbiddenException(
          'Super admins can only create school admins via this endpoint',
        );
      }
      return this.usersService.createUser(input, user.schoolId);
    }
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.usersService.updateUser(id, input, user.sub, user.role);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.changePassword(user.sub, oldPassword, newPassword);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  uploadAvatar(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: Upload,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.updateAvatar(user.sub, file);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  deactivateUser(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; role: string; schoolId: string },
  ) {
    return this.usersService.deactivateUser(
      id,
      user.sub,
      user.role,
      user.schoolId,
    );
  }
}
