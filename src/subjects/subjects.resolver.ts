import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver(() => Subject)
export class SubjectsResolver {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Mutation(() => Subject)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SUBJECTS, 'canCreate')
  @Roles(UserRole.SCHOOL_ADMIN)
  createSubject(
    @Args('name') name: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.subjectsService.createSubject(name, user.schoolId);
  }

  @Query(() => [Subject])
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(AppResource.SUBJECTS, 'canRead')
  schoolSubjects(@CurrentUser() user: { schoolId: string }) {
    return this.subjectsService.getSubjectsBySchool(user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SUBJECTS, 'canDelete')
  @Roles(UserRole.SCHOOL_ADMIN)
  deleteSubject(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.subjectsService.deleteSubject(id, user.schoolId);
  }
}
