import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './dto/announcement.input';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UserRole } from '../common/enums';

type AuthUser = { sub: string; schoolId?: string; role: UserRole };

@Resolver(() => Announcement)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class CommunicationResolver {
  constructor(private readonly communicationService: CommunicationService) {}

  @Query(() => [Announcement])
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.READ)
  announcements(@CurrentUser() user: AuthUser) {
    if (!user.schoolId) return [];
    return this.communicationService.listVisible(user.sub, user.role, user.schoolId);
  }

  @Query(() => [Announcement])
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.MANAGE)
  adminAnnouncements(@CurrentUser() user: AuthUser) {
    if (!user.schoolId) return [];
    return this.communicationService.listForAdmin(user.schoolId);
  }

  @Mutation(() => Announcement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.CREATE)
  createAnnouncement(@Args('input') input: CreateAnnouncementInput, @CurrentUser() user: AuthUser) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.communicationService.create(input, user.schoolId, user.sub);
  }

  @Mutation(() => Announcement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.UPDATE)
  updateAnnouncement(@Args('id') id: string, @Args('input') input: UpdateAnnouncementInput, @CurrentUser() user: AuthUser) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.communicationService.update(id, input, user.schoolId);
  }

  @Mutation(() => Announcement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.PUBLISH)
  publishAnnouncement(@Args('id') id: string, @CurrentUser() user: AuthUser) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.communicationService.publish(id, user.schoolId);
  }

  @Mutation(() => Boolean)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.DELETE)
  deleteAnnouncement(@Args('id') id: string, @CurrentUser() user: AuthUser) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.communicationService.delete(id, user.schoolId);
  }
}
