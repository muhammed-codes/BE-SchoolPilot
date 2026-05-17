import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards } from '@nestjs/common';
import { IdCardsService } from './id-cards.service';
import { BulkCardResult } from './dto/bulk-card-result.type';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';

@Resolver()
export class IdCardsResolver {
  constructor(private readonly idCardsService: IdCardsService) {}

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ID_CARDS, 'canCreate')
  generateStudentCard(
    @Args('studentId') studentId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateStudentCard(studentId, user.schoolId);
  }

  @Mutation(() => BulkCardResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ID_CARDS, 'canCreate')
  generateBulkStudentCards(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateBulkStudentCards(classId, user.schoolId);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ID_CARDS, 'canCreate')
  generateStaffCard(
    @Args('userId') userId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.idCardsService.generateStaffCard(userId, user.schoolId);
  }

  @Mutation(() => BulkCardResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ID_CARDS, 'canCreate')
  generateBulkStaffCards(@CurrentUser() user: { schoolId: string }) {
    return this.idCardsService.generateBulkStaffCards(user.schoolId);
  }
}
