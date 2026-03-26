import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IdCardsService } from './id-cards.service';
import { BulkCardResult } from './dto/bulk-card-result.type';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class IdCardsResolver {
  constructor(private readonly idCardsService: IdCardsService) {}

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateStudentCard(
    @Args('studentId') studentId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateStudentCard(studentId, user.schoolId);
  }

  @Mutation(() => BulkCardResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateBulkStudentCards(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateBulkStudentCards(classId, user.schoolId);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateStaffCard(
    @Args('userId') userId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateStaffCard(userId, user.schoolId);
  }

  @Mutation(() => BulkCardResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateBulkStaffCards(@CurrentUser() user: { schoolId: string }) {
    return this.idCardsService.generateBulkStaffCards(user.schoolId);
  }
}
