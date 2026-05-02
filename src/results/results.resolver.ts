import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
} from '../common/guards';
import { CurrentUser, Permissions } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ResultStatus } from '../common/enums';
import { PERMISSIONS } from '../common/access';

@Resolver()
export class ResultsResolver {
  constructor(private readonly resultsService: ResultsService) {}

  @Query(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
  )
  @Permissions(PERMISSIONS.RESULTS_VIEW)
  resultSheet(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.resultsService.getResultSheet(id, user.schoolId);
  }

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
  )
  @Permissions(PERMISSIONS.RESULTS_VIEW)
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

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.HEAD_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_APPROVE)
  pendingPrincipalApprovals(@CurrentUser() user: { schoolId: string }) {
    return this.resultsService.getPendingApprovals(user.schoolId);
  }

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
    UserRole.SCHOOL_ADMIN,
  )
  @Permissions(PERMISSIONS.RESULTS_VIEW)
  schoolResultSheets(
    @CurrentUser() user: { schoolId: string },
    @Args('status', { type: () => ResultStatus, nullable: true })
    status?: ResultStatus,
  ) {
    return this.resultsService.getSchoolResultSheets(user.schoolId, status);
  }

  @Query(() => StudentResult, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.PARENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
  )
  @Permissions(PERMISSIONS.RESULTS_VIEW)
  studentResult(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.resultsService.getStudentResult(studentId, termId);
  }

  @Query(() => [SubjectScore])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUBJECT_TEACHER, UserRole.CLASS_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_SCORE_ASSIGNED)
  mySubjectScores(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.getMySubjectScores(user.sub, resultSheetId);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_CREATE)
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
  )
  @Permissions(PERMISSIONS.RESULTS_SCORE_ASSIGNED)
  saveSubjectScores(
    @Args('input') input: SaveSubjectScoresInput,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (
      user.role === UserRole.SCHOOL_ADMIN ||
      user.role === UserRole.PRINCIPAL ||
      user.role === UserRole.VICE_PRINCIPAL ||
      user.role === UserRole.HEAD_TEACHER
    ) {
      return this.resultsService.saveAdminScores(input, user.sub, user.schoolId);
    }
    return this.resultsService.saveSubjectScores(input, user.sub, user.schoolId);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  @Permissions(PERMISSIONS.RESULTS_SUBMIT_ADMIN_REVIEW)
  submitForAdminReview(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.submitForAdminReview(
      resultSheetId,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  @Permissions(PERMISSIONS.RESULTS_SUBMIT_PRINCIPAL_APPROVAL)
  submitForPrincipalApproval(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.submitForPrincipalApproval(
      resultSheetId,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.HEAD_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_APPROVE)
  approveResult(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.approveResult(
      resultSheetId,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
  )
  @Permissions(PERMISSIONS.RESULTS_RETURN)
  returnResult(
    @Args('resultSheetId') resultSheetId: string,
    @Args('reason') reason: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.returnResult(
      resultSheetId,
      user.sub,
      user.schoolId,
      reason,
    );
  }

  @Mutation(() => SubjectScore)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUBJECT_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_SCORE_ASSIGNED)
  saveTeacherRemark(
    @Args('subjectScoreId') subjectScoreId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveTeacherRemark(subjectScoreId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.HEAD_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_APPROVE)
  savePrincipalRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.savePrincipalRemark(studentResultId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.CLASS_TEACHER)
  @Permissions(PERMISSIONS.RESULTS_SCORE_ASSIGNED)
  saveClassTeacherRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveClassTeacherRemark(studentResultId, remark);
  }
}
