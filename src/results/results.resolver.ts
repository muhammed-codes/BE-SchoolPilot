import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class ResultsResolver {
  constructor(private readonly resultsService: ResultsService) {}

  @Query(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER)
  resultSheet(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.resultsService.getResultSheet(id, user.schoolId);
  }

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER)
  resultSheetsByClass(
    @Args('classId') classId: string,
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.resultsService.getResultSheetsByClass(
      classId,
      termId,
      user.schoolId,
    );
  }

  @Query(() => StudentResult, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  studentResult(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.resultsService.getStudentResult(studentId, termId);
  }

  @Query(() => [SubjectScore])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUBJECT_TEACHER, UserRole.CLASS_TEACHER)
  mySubjectScores(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.getMySubjectScores(user.sub, resultSheetId);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER)
  createResultSheet(
    @Args('input') input: CreateResultSheetInput,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.createResultSheet(
      input,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => [SubjectScore])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUBJECT_TEACHER, UserRole.CLASS_TEACHER)
  saveSubjectScores(
    @Args('input') input: SaveSubjectScoresInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.saveSubjectScores(input, user.sub);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  submitForAdminReview(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.submitForAdminReview(resultSheetId, user.sub);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  submitForPrincipalApproval(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.submitForPrincipalApproval(
      resultSheetId,
      user.sub,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRINCIPAL)
  approveResult(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.approveResult(resultSheetId, user.sub);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  returnResult(
    @Args('resultSheetId') resultSheetId: string,
    @Args('reason') reason: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.returnResult(resultSheetId, user.sub, reason);
  }

  @Mutation(() => SubjectScore)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUBJECT_TEACHER)
  saveTeacherRemark(
    @Args('subjectScoreId') subjectScoreId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveTeacherRemark(subjectScoreId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRINCIPAL)
  savePrincipalRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.savePrincipalRemark(studentResultId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLASS_TEACHER)
  saveClassTeacherRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveClassTeacherRemark(studentResultId, remark);
  }
}
