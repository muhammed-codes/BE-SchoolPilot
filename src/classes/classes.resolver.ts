import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { TEACHER_ROLES } from '../common/constants/roles.constant';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedClass = createPaginatedType(ClassEntity);

@Resolver(() => ClassEntity)
export class ClassesResolver {
  constructor(private readonly classesService: ClassesService) {}

  @Mutation(() => ClassEntity)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canCreate')
  @Roles(UserRole.SCHOOL_ADMIN)
  createClass(
    @Args('input') input: CreateClassInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.classesService.createClass(input, user.schoolId);
  }

  @Query(() => PaginatedClass)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canRead')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
    ...TEACHER_ROLES,
  )
  schoolClasses(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (TEACHER_ROLES.includes(user.role)) {
      return this.classesService.getClassesForTeacherPaginated(
        user.sub,
        user.schoolId,
        pagination,
      );
    }
    return this.classesService.getClassesBySchool(user.schoolId, pagination);
  }

  @Query(() => [ClassEntity])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canRead')
  @Roles(UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  myClasses(@CurrentUser() user: { sub: string; schoolId: string }) {
    return this.classesService.getClassesForTeacher(user.sub, user.schoolId);
  }

  @Query(() => ClassEntity)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canRead')
  classById(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.classesService.getClassById(id, user.schoolId);
  }

  @Mutation(() => ClassEntity)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canUpdate')
  @Roles(UserRole.SCHOOL_ADMIN)
  assignClassTeacher(
    @Args('classId') classId: string,
    @Args('teacherId') teacherId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.classesService.assignClassTeacher(
      classId,
      teacherId,
      user.schoolId,
    );
  }

  @Mutation(() => ClassEntity)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canUpdate')
  @Roles(UserRole.SCHOOL_ADMIN)
  assignSubjectsToClass(
    @Args('classId') classId: string,
    @Args('subjectIds', { type: () => [String] }) subjectIds: string[],
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.classesService.assignSubjectsToClass(
      classId,
      subjectIds,
      user.schoolId,
    );
  }

  @Mutation(() => ClassSubject)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.CLASSES, 'canUpdate')
  @Roles(UserRole.SCHOOL_ADMIN)
  assignSubjectTeacher(
    @Args('classId') classId: string,
    @Args('subjectId') subjectId: string,
    @Args('teacherId') teacherId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.classesService.assignSubjectTeacher(
      classId,
      subjectId,
      teacherId,
      user.schoolId,
    );
  }
}
