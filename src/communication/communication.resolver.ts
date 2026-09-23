import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { Announcement } from './entities/announcement.entity';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './dto/announcement.input';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { UserRole } from '../common/enums';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedAnnouncement = createPaginatedType(Announcement);

type AuthUser = { sub: string; schoolId?: string; role: UserRole };

@Resolver(() => Announcement)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class CommunicationResolver {
  constructor(private readonly communicationService: CommunicationService) {}

  @Query(() => [Announcement])
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.READ)
  announcements(@CurrentUser() user: AuthUser) {
    if (!user.schoolId) return [];
    return this.communicationService.listVisible(
      user.sub,
      user.role,
      user.schoolId,
    );
  }

  @Query(() => PaginatedAnnouncement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.READ)
  announcementsPage(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.schoolId) return { items: [], total: 0, page: 1, totalPages: 0 };
    return this.communicationService.listVisiblePaginated(
      user.sub,
      user.role,
      user.schoolId,
      pagination,
    );
  }

  @Query(() => PaginatedAnnouncement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.MANAGE)
  adminAnnouncementsPage(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.schoolId) return { items: [], total: 0, page: 1, totalPages: 0 };
    return this.communicationService.listForAdmin(user.schoolId, pagination);
  }

  @Mutation(() => Announcement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.CREATE)
  createAnnouncement(
    @Args('input') input: CreateAnnouncementInput,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.communicationService.create(input, user.schoolId, user.sub);
  }

  @Mutation(() => Announcement)
  @RequirePermission(AppResource.COMMUNICATION, PermissionAction.UPDATE)
  updateAnnouncement(
    @Args('id') id: string,
    @Args('input') input: UpdateAnnouncementInput,
    @CurrentUser() user: AuthUser,
  ) {
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
