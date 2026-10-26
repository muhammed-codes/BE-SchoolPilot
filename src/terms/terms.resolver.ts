import { UserRole } from '../common/enums/role.enum';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TermsService } from './terms.service';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';

@Resolver()
export class TermsResolver {
  constructor(private readonly termsService: TermsService) {}

  @Query(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(...Object.values(UserRole))
  activeTerm(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getActiveTerm(user.schoolId);
  }

  @Query(() => Term, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(...Object.values(UserRole))
  term(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.termsService.getTermById(id, user.schoolId);
  }

  @Query(() => Session, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(...Object.values(UserRole))
  session(@Args('id') id: string, @CurrentUser() user: { schoolId: string }) {
    return this.termsService.getSessionById(id, user.schoolId);
  }

  @Query(() => [Session])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(...Object.values(UserRole))
  sessions(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getSessionsBySchool(user.schoolId);
  }

  @Query(() => [Term])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(...Object.values(UserRole))
  termsBySession(
    @Args('sessionId') sessionId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.getTermsBySession(sessionId, user.schoolId);
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.CREATE)
  createSession(
    @Args('input') input: CreateSessionInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createSession(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.CREATE)
  createTerm(
    @Args('input') input: CreateTermInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createTerm(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.UPDATE)
  activateTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.activateTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.UPDATE)
  closeTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.closeTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.UPDATE)
  unlockTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.unlockTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SETTINGS, PermissionAction.UPDATE)
  updateTotalSchoolDays(
    @Args('termId') termId: string,
    @Args('days', { type: () => Int }) days: number,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.updateTotalSchoolDays(termId, days, user.schoolId);
  }
}
