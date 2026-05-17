import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards } from '@nestjs/common';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
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
  @RequirePermission(AppResource.STUDENTS, 'canRead')
  studentsByClass(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.getStudentsByClass(classId, user.schoolId);
  }

  @Query(() => Student, { nullable: true })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canRead')
  student(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.studentsService.getStudentById(id, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canRead')
  myChildren(@CurrentUser() user: { sub: string }) {
    return this.studentsService.getStudentsByParent(user.sub);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canRead')
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
  @RequirePermission(AppResource.STUDENTS, 'canCreate')
  createStudent(
    @Args('input') input: CreateStudentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.createStudent(input, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canUpdate')
  updateStudent(
    @Args('id') id: string,
    @Args('input') input: UpdateStudentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.updateStudent(id, input, user.schoolId);
  }

  @Mutation(() => BulkImportResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canCreate')
  bulkImportStudents(
    @Args('students', { type: () => [CreateStudentInput] })
    students: CreateStudentInput[],
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.bulkImportStudents(students, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canUpdate')
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
  @RequirePermission(AppResource.STUDENTS, 'canUpdate')
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

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canCreate')
  uploadPassportPhoto(
    @Args('studentId') studentId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Upload,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.uploadPassportPhoto(
      studentId,
      file,
      user.schoolId,
    );
  }

  @Mutation(() => PromotionResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, 'canUpdate')
  promoteStudents(
    @Args('input') input: PromoteStudentsInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.promoteStudents(input, user.schoolId);
  }
}
