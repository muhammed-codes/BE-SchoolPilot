import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';

@Resolver(() => Subject)
export class SubjectsResolver {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Mutation(() => Subject)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SUBJECTS, 'canCreate')
  createSubject(
    @Args('name') name: string,
    @CurrentUser() user: { schoolId: string },
    @Args('code', { nullable: true }) code?: string,
  ) {
    return this.subjectsService.createSubject(name, user.schoolId, code);
  }

  @Mutation(() => Subject)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.SUBJECTS, 'canUpdate')
  updateSubject(
    @CurrentUser() user: { schoolId: string },
    @Args('id', { nullable: true }) id?: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('code', { nullable: true }) code?: string,
    @Args('input', { nullable: true }) input?: UpdateSubjectInput,
  ) {
    const targetId = input?.id || id;
    if (!targetId) {
      throw new BadRequestException('Subject ID is required for update');
    }
    const targetName = input?.name !== undefined ? input.name : name;
    const targetCode = input?.code !== undefined ? input.code : code;
    return this.subjectsService.updateSubject(
      targetId,
      user.schoolId,
      targetName,
      targetCode,
    );
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
  deleteSubject(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.subjectsService.deleteSubject(id, user.schoolId);
  }
}
