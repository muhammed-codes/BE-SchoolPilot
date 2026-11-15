import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';
import { ResultTemplate } from './entities/result-template.entity';
import { ResultTemplatesService } from './result-templates.service';
import {
  CreateResultTemplateInput,
  UpdateResultTemplateInput,
  AssignTemplateToClassesInput,
} from './dto/result-template.input';
import { GraphQLJSONObject } from '../common/scalars/json-object.scalar';
import { ResultTemplateConfig } from './templates/result-template-config.interface';

@Resolver(() => ResultTemplate)
export class ResultTemplatesResolver {
  constructor(
    private readonly templatesService: ResultTemplatesService,
  ) {}

  private canManageTemplates = (role: UserRole) => {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);
  };

  @Query(() => [ResultTemplate])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.READ)
  resultTemplates(
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<ResultTemplate[]> {
    return this.templatesService.listTemplates(user.schoolId);
  }

  @Query(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.READ)
  resultTemplate(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ): Promise<ResultTemplate> {
    return this.templatesService.getTemplateById(id, user.schoolId);
  }

  @Query(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.READ)
  resolvedClassTemplate(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ): Promise<ResultTemplate> {
    return this.templatesService.getResolvedTemplateForClass(classId, user.schoolId);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.READ)
  previewReportCardHtml(
    @Args('templateId', { nullable: true }) templateId?: string,
    @Args('config', { type: () => GraphQLJSONObject, nullable: true })
    config?: ResultTemplateConfig,
    @CurrentUser() user?: { schoolId: string },
  ): Promise<string> {
    return this.templatesService.getPreviewHtml(
      templateId,
      config,
      user?.schoolId,
    );
  }

  @Mutation(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.CREATE)
  createResultTemplate(
    @Args('input') input: CreateResultTemplateInput,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<ResultTemplate> {
    if (!this.canManageTemplates(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to create result templates',
      );
    }
    return this.templatesService.createTemplate(input, user.schoolId);
  }

  @Mutation(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.UPDATE)
  updateResultTemplate(
    @Args('id') id: string,
    @Args('input') input: UpdateResultTemplateInput,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<ResultTemplate> {
    if (!this.canManageTemplates(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to edit result templates',
      );
    }
    return this.templatesService.updateTemplate(id, input, user.schoolId);
  }

  @Mutation(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.CREATE)
  duplicateResultTemplate(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<ResultTemplate> {
    if (!this.canManageTemplates(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to duplicate result templates',
      );
    }
    return this.templatesService.duplicateTemplate(id, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.DELETE)
  deleteResultTemplate(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<boolean> {
    if (!this.canManageTemplates(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to delete result templates',
      );
    }
    return this.templatesService.deleteTemplate(id, user.schoolId);
  }

  @Mutation(() => ResultTemplate)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, PermissionAction.UPDATE)
  assignTemplateToClasses(
    @Args('input') input: AssignTemplateToClassesInput,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ): Promise<ResultTemplate> {
    if (!this.canManageTemplates(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to assign result templates',
      );
    }
    return this.templatesService.assignTemplateToClasses(
      input.templateId,
      input.classIds,
      Boolean(input.setAsSchoolDefault),
      user.schoolId,
    );
  }
}
