import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TermsService } from './terms.service';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
import { JwtAuthGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';

@Resolver()
export class TermsResolver {
  constructor(private readonly termsService: TermsService) {}

  @Query(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canRead')
  activeTerm(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getActiveTerm(user.schoolId);
  }

  @Query(() => [Session])
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canRead')
  sessions(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getSessionsBySchool(user.schoolId);
  }

  @Query(() => [Term])
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canRead')
  termsBySession(
    @Args('sessionId') sessionId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.getTermsBySession(sessionId, user.schoolId);
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canCreate')
  createSession(
    @Args('input') input: CreateSessionInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createSession(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canCreate')
  createTerm(
    @Args('input') input: CreateTermInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createTerm(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canUpdate')
  activateTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.activateTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canUpdate')
  closeTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.closeTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canUpdate')
  unlockTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.unlockTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, 'canUpdate')
  updateTotalSchoolDays(
    @Args('termId') termId: string,
    @Args('days', { type: () => Int }) days: number,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.updateTotalSchoolDays(termId, days, user.schoolId);
  }
}
