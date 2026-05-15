import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole, ResultStatus } from '../common/enums';

@Resolver()
export class ResultsResolver {
  constructor(private readonly resultsService: ResultsService) {}

  @Query(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
  resultSheet(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    return this.resultsService.getResultSheet(id, user.schoolId, user.sub, user.role);
  }

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
  pendingPrincipalApprovals(@CurrentUser() user: { schoolId: string }) {
    return this.resultsService.getPendingApprovals(user.schoolId);
  }

  @Query(() => [ResultSheet])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
  schoolResultSheets(
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
    @Args('status', { type: () => ResultStatus, nullable: true })
    status?: ResultStatus,
  ) {
    return this.resultsService.getSchoolResultSheets(
      user.schoolId,
      user.sub,
      user.role,
      status,
    );
  }

  @Query(() => StudentResult, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
  studentResult(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.resultsService.getStudentResult(studentId, termId);
  }

  @Query(() => [SubjectScore])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
  mySubjectScores(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resultsService.getMySubjectScores(user.sub, resultSheetId);
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canCreate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
  saveSubjectScores(
    @Args('input') input: SaveSubjectScoresInput,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (
      user.role === UserRole.SCHOOL_ADMIN ||
      user.role === UserRole.PRINCIPAL
    ) {
      return this.resultsService.saveAdminScores(
        input,
        user.sub,
        user.schoolId,
      );
    }
    return this.resultsService.saveSubjectScores(
      input,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
  publishResultSheet(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.resultsService.publishResultSheet(
      resultSheetId,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => ResultSheet)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
  saveTeacherRemark(
    @Args('subjectScoreId') subjectScoreId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveTeacherRemark(subjectScoreId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
  savePrincipalRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.savePrincipalRemark(studentResultId, remark);
  }

  @Mutation(() => StudentResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canUpdate')
  saveClassTeacherRemark(
    @Args('studentResultId') studentResultId: string,
    @Args('remark') remark: string,
  ) {
    return this.resultsService.saveClassTeacherRemark(studentResultId, remark);
  }
}
