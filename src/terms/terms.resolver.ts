import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TermsService } from './terms.service';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class TermsResolver {
  constructor(private readonly termsService: TermsService) {}

  @Query(() => Term)
  @UseGuards(JwtAuthGuard)
  activeTerm(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getActiveTerm(user.schoolId);
  }

  @Query(() => [Session])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  sessions(@CurrentUser() user: { schoolId: string }) {
    return this.termsService.getSessionsBySchool(user.schoolId);
  }

  @Query(() => [Term])
  @UseGuards(JwtAuthGuard)
  termsBySession(@Args('sessionId') sessionId: string) {
    return this.termsService.getTermsBySession(sessionId);
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  createSession(
    @Args('input') input: CreateSessionInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createSession(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  createTerm(
    @Args('input') input: CreateTermInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.createTerm(input, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  activateTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.activateTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  closeTerm(
    @Args('termId') termId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.termsService.closeTerm(termId, user.schoolId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  unlockTerm(@Args('termId') termId: string) {
    return this.termsService.unlockTerm(termId);
  }

  @Mutation(() => Term)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  updateTotalSchoolDays(
    @Args('termId') termId: string,
    @Args('days', { type: () => Int }) days: number,
  ) {
    return this.termsService.updateTotalSchoolDays(termId, days);
  }
}
