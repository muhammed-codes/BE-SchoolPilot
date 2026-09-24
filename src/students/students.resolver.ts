import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UseGuards } from '@nestjs/common';

import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { StudentParent } from './entities/student-parent.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
import { StudentStatistics } from './dto/student-statistics.type';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
import { Gender, StudentStatus, UserRole } from '../common/enums';
import { TEACHER_ROLES } from '../common/constants/roles.constant';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedStudent = createPaginatedType(Student);

@Resolver(() => Student)
export class StudentsResolver {
  constructor(private readonly studentsService: StudentsService) {}

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  studentsByClass(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.getStudentsByClass(classId, user.schoolId);
  }

  @Query(() => Student, { nullable: true })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  student(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.studentsService.getStudentById(id, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(UserRole.PARENT)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  myChildren(@CurrentUser() user: { sub: string; schoolId: string }) {
    return this.studentsService.getStudentsByParent(user.sub, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  guardianStudents(
    @Args('guardianId') guardianId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.getStudentsByParent(guardianId, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  searchStudents(
    @Args('query') query: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number = 5,
  ) {
    const take = limit && limit > 0 ? limit : 5;
    if (TEACHER_ROLES.includes(user.role)) {
      return this.studentsService.searchStudentsForTeacher(
        query,
        user.sub,
        user.schoolId,
        take,
      );
    }
    return this.studentsService.searchStudents(
      query,
      user.schoolId,
      undefined,
      take,
    );
  }

  @Query(() => PaginatedStudent)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  studentsPage(
    @Args('query', { type: () => String, defaultValue: '' }) query: string,
    @Args('classId', { type: () => String, nullable: true }) classId: string,
    @Args('gender', { type: () => Gender, nullable: true }) gender: Gender,
    @Args('status', { type: () => StudentStatus, nullable: true })
    status: StudentStatus,
    @Args('archived', { type: () => Boolean, defaultValue: false })
    archived: boolean,
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    const classIdsPromise = TEACHER_ROLES.includes(user.role)
      ? this.studentsService.getTeacherClassIds(user.sub, user.schoolId)
      : Promise.resolve(undefined);
    return classIdsPromise.then((classIds) =>
      this.studentsService.getPaginatedStudents(user.schoolId, {
        ...pagination,
        query,
        classId,
        gender,
        status,
        archived,
        classIds,
      }),
    );
  }

  @Query(() => StudentStatistics)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  studentStatistics(
    @Args('query', { type: () => String, defaultValue: '' }) query: string,
    @Args('classId', { type: () => String, nullable: true }) classId: string,
    @Args('archived', { type: () => Boolean, defaultValue: false }) archived: boolean,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    const classIdsPromise = TEACHER_ROLES.includes(user.role)
      ? this.studentsService.getTeacherClassIds(user.sub, user.schoolId)
      : Promise.resolve(undefined);
    return classIdsPromise.then((classIds) =>
      this.studentsService.getStudentStatistics(user.schoolId, {
        query,
        classId,
        archived,
        classIds,
      }),
    );
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.CREATE)
  createStudent(
    @Args('input') input: CreateStudentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.createStudent(input, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.UPDATE)
  updateStudent(
    @Args('id') id: string,
    @Args('input') input: UpdateStudentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.updateStudent(id, input, user.schoolId);
  }

  @Mutation(() => BulkImportResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.CREATE)
  bulkImportStudents(
    @Args('students', { type: () => [CreateStudentInput] })
    students: CreateStudentInput[],
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.bulkImportStudents(students, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.UPDATE)
  linkParent(
    @Args('studentId') studentId: string,
    @Args('parentUserId') parentUserId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.linkParent(
      studentId,
      parentUserId,
      user.schoolId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.UPDATE)
  unlinkParent(
    @Args('studentId') studentId: string,
    @Args('parentUserId') parentUserId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.unlinkParent(
      studentId,
      parentUserId,
      user.schoolId,
    );
  }

  @Query(() => [StudentParent])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  studentParents(
    @Args('studentId') studentId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.getParentsByStudent(studentId, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.CREATE)
  uploadPassportPhoto(
    @Args('studentId') studentId: string,
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.uploadPassportPhoto(
      studentId,
      imageUrl,
      user.schoolId,
    );
  }

  @Mutation(() => PromotionResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.UPDATE)
  promoteStudents(
    @Args('input') input: PromoteStudentsInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.promoteStudents(input, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  archivedStudents(@CurrentUser() user: { schoolId: string }) {
    return this.studentsService.getArchivedStudents(user.schoolId);
  }
}
