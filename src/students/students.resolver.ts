import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
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
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';
import { TEACHER_ROLES } from '../common/constants/roles.constant';

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
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  myChildren(@CurrentUser() user: { sub: string }) {
    return this.studentsService.getStudentsByParent(user.sub);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.READ)
  searchStudents(
    @Args('query') query: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (TEACHER_ROLES.includes(user.role)) {
      return this.studentsService.searchStudentsForTeacher(
        query,
        user.sub,
        user.schoolId,
      );
    }
    return this.studentsService.searchStudents(query, user.schoolId);
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
