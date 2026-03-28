import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver(() => Student)
export class StudentsResolver {
  constructor(private readonly studentsService: StudentsService) {}

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
  )
  studentsByClass(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.getStudentsByClass(classId, user.schoolId);
  }

  @Query(() => Student, { nullable: true })
  @UseGuards(JwtAuthGuard)
  student(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.studentsService.getStudentById(id, user.schoolId);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  myChildren(@CurrentUser() user: { sub: string }) {
    return this.studentsService.getStudentsByParent(user.sub);
  }

  @Query(() => [Student])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  searchStudents(
    @Args('query') query: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.searchStudents(query, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  createStudent(
    @Args('input') input: CreateStudentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.createStudent(input, user.schoolId);
  }

  @Mutation(() => BulkImportResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  bulkImportStudents(
    @Args('students', { type: () => [CreateStudentInput] })
    students: CreateStudentInput[],
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.bulkImportStudents(students, user.schoolId);
  }

  @Mutation(() => Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  promoteStudents(
    @Args('input') input: PromoteStudentsInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.studentsService.promoteStudents(input, user.schoolId);
  }
}
