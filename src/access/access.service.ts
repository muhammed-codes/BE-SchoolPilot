import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../common/enums/role.enum';
import { AppResource } from './enums/resource.enum';
import { PermissionAction } from './enums/permission-action.enum';
import { PermissionEffect } from './enums/permission-effect.enum';
import { PermissionGroup } from './entities/permission-group.entity';
import { PermissionGroupPermission } from './entities/permission-group-permission.entity';
import { UserPermissionGroup } from './entities/user-permission-group.entity';
import { UserPermission } from './entities/user-permission.entity';
import { ActionType } from '../common/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';
import { EffectivePermission } from './dto/effective-permission.type';

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(
    @InjectRepository(RolePermission)
    private readonly permissionRepo: Repository<RolePermission>,
    @InjectRepository(PermissionGroup)
    private readonly groupRepo: Repository<PermissionGroup>,
    @InjectRepository(PermissionGroupPermission)
    private readonly groupPermissionRepo: Repository<PermissionGroupPermission>,
    @InjectRepository(UserPermissionGroup)
    private readonly userGroupRepo: Repository<UserPermissionGroup>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepo: Repository<UserPermission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private normalizeAction(action: ActionType): PermissionAction {
    const legacyMap: Record<string, PermissionAction> = {
      canCreate: PermissionAction.CREATE,
      canRead: PermissionAction.READ,
      canUpdate: PermissionAction.UPDATE,
      canDelete: PermissionAction.DELETE,
    };
    return legacyMap[action] || (action as PermissionAction);
  }

  /**
   * Effective access is additive during migration: legacy role permissions are
   * preserved, group grants add access, and an individual DENY wins last.
   */
  async hasPermission(
    userId: string,
    role: UserRole,
    schoolId: string | null | undefined,
    resource: AppResource,
    action: ActionType,
  ): Promise<boolean> {
    if (role === UserRole.SUPER_ADMIN) return true;
    if (role === UserRole.SCHOOL_ADMIN) return Boolean(schoolId);
    if (!schoolId) return false;

    const normalizedAction = this.normalizeAction(action);
    const legacyAction = {
      [PermissionAction.CREATE]: 'canCreate',
      [PermissionAction.READ]: 'canRead',
      [PermissionAction.UPDATE]: 'canUpdate',
      [PermissionAction.DELETE]: 'canDelete',
    }[normalizedAction];

    let allowed = false;
    if (legacyAction) {
      const rolePermissions = await this.getPermissionsByRole(role, schoolId);
      const permission = rolePermissions.find((p) => p.resource === resource);
      allowed = permission?.[legacyAction as keyof RolePermission] === true;
    }

    const activeGroupIds = await this.getActiveGroupIds(userId, schoolId);
    if (activeGroupIds.length > 0) {
      const groupPermissions = await this.groupPermissionRepo.find({
        where: {
          schoolId,
          groupId: In(activeGroupIds),
          resource,
          action: normalizedAction,
        },
      });
      allowed = allowed || groupPermissions.length > 0;
    }

    const individual = await this.userPermissionRepo.findOne({
      where: { userId, schoolId, resource, action: normalizedAction },
    });
    if (individual?.effect === PermissionEffect.DENY) return false;
    if (individual?.effect === PermissionEffect.GRANT) return true;
    return allowed;
  }

  private async getActiveGroupIds(
    userId: string,
    schoolId: string,
  ): Promise<string[]> {
    const assignments = await this.userGroupRepo.find({
      where: { userId, schoolId },
    });
    if (assignments.length === 0) return [];

    const groups = await this.groupRepo.find({
      where: {
        id: In(assignments.map((assignment) => assignment.groupId)),
        schoolId,
        isActive: true,
      },
    });
    return groups.map((group) => group.id);
  }

  getPermissionGroups = (schoolId: string) =>
    this.groupRepo.find({ where: { schoolId }, order: { name: 'ASC' } });

  getUserPermissionGroups = (userId: string, schoolId: string) =>
    this.userGroupRepo.find({ where: { userId, schoolId } });

  getUserPermissionOverrides = (userId: string, schoolId: string) =>
    this.userPermissionRepo.find({ where: { userId, schoolId } });

  async getEffectivePermissions(
    userId: string,
    role: UserRole,
    schoolId?: string | null,
  ): Promise<EffectivePermission[]> {
    const resources = Object.values(AppResource);
    const actions = Object.values(PermissionAction);

    if (
      role === UserRole.SUPER_ADMIN ||
      (role === UserRole.SCHOOL_ADMIN && schoolId)
    ) {
      return resources.flatMap((resource) =>
        actions.map((action) => ({
          resource,
          action,
          allowed: true,
          source: 'administrator',
        })),
      );
    }
    if (!schoolId) return [];

    const rolePermissions = await this.getPermissionsByRole(role, schoolId);
    const activeGroupIds = await this.getActiveGroupIds(userId, schoolId);
    const groupPermissions = activeGroupIds.length
      ? await this.groupPermissionRepo.find({
          where: {
            schoolId,
            groupId: In(activeGroupIds),
          },
        })
      : [];
    const overrides = await this.userPermissionRepo.find({
      where: { userId, schoolId },
    });

    return resources.flatMap((resource) =>
      actions.map((action) => {
        const rolePermission = rolePermissions.find(
          (permission) => permission.resource === resource,
        );
        const legacyAction = {
          [PermissionAction.CREATE]: 'canCreate',
          [PermissionAction.READ]: 'canRead',
          [PermissionAction.UPDATE]: 'canUpdate',
          [PermissionAction.DELETE]: 'canDelete',
        }[action] as keyof RolePermission | undefined;
        const roleAllowed = legacyAction
          ? rolePermission?.[legacyAction] === true
          : false;
        const groupAllowed = groupPermissions.some(
          (permission) =>
            permission.resource === resource && permission.action === action,
        );
        const override = overrides.find(
          (permission) =>
            permission.resource === resource && permission.action === action,
        );
        return {
          resource,
          action,
          source: override
            ? `individual_${override.effect.toLowerCase()}`
            : groupAllowed
              ? 'group'
              : roleAllowed
                ? 'default'
                : 'none',
          allowed:
            override?.effect === PermissionEffect.DENY
              ? false
              : override?.effect === PermissionEffect.GRANT ||
                roleAllowed ||
                groupAllowed,
        };
      }),
    );
  }

  async getEffectivePermissionsForUser(userId: string, schoolId: string) {
    const user = await this.assertSchoolUser(userId, schoolId);
    return this.getEffectivePermissions(user.id, user.role, user.schoolId);
  }

  private async assertSchoolUser(userId: string, schoolId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, schoolId },
    });
    if (!user)
      throw new ForbiddenException('User does not belong to this school');
    return user;
  }

  private async assertSchoolGroup(groupId: string, schoolId: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId, schoolId },
    });
    if (!group)
      throw new ForbiddenException(
        'Permission group does not belong to this school',
      );
    return group;
  }

  async createPermissionGroup(
    input: { name: string; description?: string; schoolId?: string },
    schoolId: string,
  ) {
    if (!input.name.trim())
      throw new BadRequestException('Group name cannot be empty');
    const group = this.groupRepo.create({
      schoolId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    });
    return this.groupRepo.save(group);
  }

  async updatePermissionGroup(
    input: {
      id: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    },
    schoolId: string,
  ) {
    if (input.name !== undefined && !input.name.trim())
      throw new BadRequestException('Group name cannot be empty');
    await this.assertSchoolGroup(input.id, schoolId);
    await this.groupRepo.update(input.id, {
      ...(input.name === undefined ? {} : { name: input.name.trim() }),
      ...(input.description === undefined
        ? {}
        : { description: input.description.trim() || null }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    });
    return this.groupRepo.findOneByOrFail({ id: input.id, schoolId });
  }

  async deletePermissionGroup(groupId: string, schoolId: string) {
    return this.groupRepo.manager.transaction(async (manager) => {
      const group = await manager.findOne(PermissionGroup, {
        where: { id: groupId, schoolId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!group)
        throw new ForbiddenException(
          'Permission group does not belong to this school',
        );
      if (
        await manager.count(UserPermissionGroup, {
          where: { groupId, schoolId },
        })
      )
        throw new ForbiddenException(
          'Remove staff assignments before deleting this group',
        );
      await manager.delete(PermissionGroupPermission, { groupId, schoolId });
      await manager.delete(PermissionGroup, { id: groupId, schoolId });
      return true;
    });
  }

  async setPermissionGroupPermissions(
    groupId: string,
    permissions: { resource: AppResource; action: PermissionAction }[],
    schoolId: string,
  ) {
    return this.groupRepo.manager.transaction(async (manager) => {
      const group = await manager.findOne(PermissionGroup, {
        where: { id: groupId, schoolId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!group)
        throw new ForbiddenException(
          'Permission group does not belong to this school',
        );
      const unique = [
        ...new Map(
          permissions.map((p) => [`${p.resource}:${p.action}`, p]),
        ).values(),
      ];
      await manager.delete(PermissionGroupPermission, { groupId, schoolId });
      if (unique.length)
        await manager.save(
          PermissionGroupPermission,
          unique.map(({ resource, action }) =>
            manager.create(PermissionGroupPermission, {
              groupId,
              schoolId,
              resource,
              action,
            }),
          ),
        );
      return manager.find(PermissionGroupPermission, {
        where: { groupId, schoolId },
      });
    });
  }

  getPermissionGroupPermissions = (groupId: string, schoolId: string) =>
    this.assertSchoolGroup(groupId, schoolId).then(() =>
      this.groupPermissionRepo.find({ where: { groupId, schoolId } }),
    );

  async assignPermissionGroup(
    userId: string,
    groupId: string,
    schoolId: string,
  ) {
    await this.assertSchoolUser(userId, schoolId);
    return this.groupRepo.manager.transaction(async (manager) => {
      const group = await manager.findOne(PermissionGroup, {
        where: { id: groupId, schoolId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!group)
        throw new ForbiddenException(
          'Permission group does not belong to this school',
        );
      const existing = await manager.findOne(UserPermissionGroup, {
        where: { userId, groupId, schoolId },
      });
      if (existing) return existing;
      return manager.save(
        UserPermissionGroup,
        manager.create(UserPermissionGroup, { userId, groupId, schoolId }),
      );
    });
  }

  async removePermissionGroup(
    userId: string,
    groupId: string,
    schoolId: string,
  ) {
    await this.assertSchoolUser(userId, schoolId);
    await this.assertSchoolGroup(groupId, schoolId);
    await this.userGroupRepo.delete({ userId, groupId, schoolId });
    return true;
  }

  async setUserPermission(
    input: {
      userId?: string;
      resource?: AppResource;
      action?: PermissionAction;
      effect?: PermissionEffect;
    },
    schoolId: string,
  ) {
    const userId = input.userId?.trim();
    const resource = input.resource;
    const action = input.action;
    const effect = input.effect;
    if (!userId) {
      throw new BadRequestException(
        'A userId is required for a permission override',
      );
    }
    if (!resource || !action || !effect) {
      throw new BadRequestException(
        'A resource, action, and effect are required for a permission override',
      );
    }

    await this.assertSchoolUser(userId, schoolId);
    const existing = await this.userPermissionRepo.findOne({
      where: {
        userId,
        schoolId,
        resource,
        action,
      },
    });
    if (existing) {
      existing.effect = effect;
      return this.userPermissionRepo.save(existing);
    }
    return this.userPermissionRepo.save(
      this.userPermissionRepo.create({
        userId,
        schoolId,
        resource,
        action,
        effect,
      }),
    );
  }

  async removeUserPermission(
    userId: string,
    resource: AppResource,
    action: PermissionAction,
    schoolId: string,
  ) {
    await this.assertSchoolUser(userId, schoolId);
    await this.userPermissionRepo.delete({
      userId,
      schoolId,
      resource,
      action,
    });
    return true;
  }

  /**
   * On module init, seed global default permissions (schoolId = null) for ALL roles,
   * and repair existing rows if necessary.
   */
  async onModuleInit() {
    try {
      await this.permissionRepo.query(
        `ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'timetable'`,
      );
    } catch {
      // Safe fallback if type doesn't exist yet or already has value
    }
    try {
      await this.permissionRepo.query(
        `ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'fees'`,
      );
    } catch {
      // Safe fallback if type doesn't exist yet or already has value
    }
    try {
      await this.permissionRepo.query(
        `ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'access'`,
      );
      await this.permissionRepo.query(
        `ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'communication'`,
      );
    } catch {
      // Safe fallback if type doesn't exist yet or already has value
    }
    try {
      await this.permissionRepo.query(
        `ALTER TYPE "role_permissions_role_enum" ADD VALUE IF NOT EXISTS 'bursar'`,
      );
    } catch {
      // Safe fallback if type doesn't exist yet or already has value
    }

    try {
      await this.seedGlobalDefaultPermissions();
      // Existing school decisions must never be overwritten on restart.
    } catch (err) {
      console.error('Error initializing permissions in AccessService:', err);
    }
  }

  /**
   * Calculates comprehensive default permissions for any (role x resource) pair.
   */
  private getDefaultRolePermissions = (
    role: UserRole,
    resource: AppResource,
  ): {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  } => {
    // 1. SUPER_ADMIN & SCHOOL_ADMIN: Full global/school permissions
    if (role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN) {
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    }

    // School management is one permission profile, with three distinct staff roles.
    if (
      role === UserRole.PRINCIPAL ||
      role === UserRole.VICE_PRINCIPAL ||
      role === UserRole.HEAD_TEACHER
    ) {
      const isSettings = [AppResource.SETTINGS, AppResource.ACCESS].includes(
        resource,
      );
      return {
        canRead: !isSettings,
        canCreate: !isSettings,
        canUpdate: !isSettings,
        canDelete: !isSettings,
      };
    }

    // Class teachers receive academic permissions; record scope is mandatory.
    if (role === UserRole.CLASS_TEACHER) {
      const readable = [
        AppResource.STUDENTS,
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.CLASSES,
        AppResource.SUBJECTS,
        AppResource.TIMETABLE,
        AppResource.COMMUNICATION,
      ];
      const canCreateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.STUDENTS,
      ].includes(resource);
      const canUpdateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.STUDENTS,
        AppResource.CLASSES,
      ].includes(resource);
      return {
        canRead: readable.includes(resource),
        canCreate: canCreateRes,
        canUpdate: canUpdateRes,
        canDelete: false,
      };
    }

    // Subject teachers receive academic permissions within their assignments.
    if (role === UserRole.SUBJECT_TEACHER) {
      const readable = [
        AppResource.STUDENTS,
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.CLASSES,
        AppResource.SUBJECTS,
        AppResource.TIMETABLE,
        AppResource.COMMUNICATION,
      ];
      const canCreateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
      ].includes(resource);
      const canUpdateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
      ].includes(resource);
      return {
        canRead: readable.includes(resource),
        canCreate: canCreateRes,
        canUpdate: canUpdateRes,
        canDelete: false,
      };
    }

    // BURSAR retains finance role access (fees and expenses).
    if (role === UserRole.BURSAR) {
      const isFinance =
        resource === AppResource.FEES || resource === AppResource.EXPENSES;
      return {
        canRead: isFinance,
        canCreate: isFinance,
        canUpdate: isFinance,
        canDelete: isFinance,
      };
    }

    // 7. PARENT: Read-only access to children's academic info
    if (role === UserRole.PARENT) {
      const parentReadRes = [
        AppResource.STUDENTS,
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.CLASSES,
        AppResource.SUBJECTS,
        AppResource.TIMETABLE,
        AppResource.FEES,
        AppResource.COMMUNICATION,
      ];
      return {
        canRead: parentReadRes.includes(resource),
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      };
    }

    return {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    };
  };

  /**
   * Get permissions for a role scoped to a specific school.
   * Missing school rows deny access; global rows are seed templates only.
   * Auto-seeds school default permissions in background if missing.
   */
  private permissionProfile(role: UserRole): UserRole {
    return [
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role)
      ? UserRole.PRINCIPAL
      : role;
  }

  getPermissionsByRole = async (role: UserRole, schoolId?: string | null) => {
    const profile = this.permissionProfile(role);
    if (role === UserRole.SUPER_ADMIN) {
      return this.permissionRepo.find({
        where: { role: profile, schoolId: IsNull() },
      });
    }
    if (!schoolId) return [];
    // Missing rows are denied until explicitly seeded; never inherit global grants.
    return this.permissionRepo.find({ where: { role: profile, schoolId } });
  };

  /**
   * Returns all permissions for a given school (for settings page).
   * SUPER_ADMIN requesting with no schoolId gets global rows.
   */
  getAllPermissions = (schoolId?: string | null) => {
    if (!schoolId) {
      return this.permissionRepo.find({ where: { schoolId: IsNull() } });
    }
    return this.permissionRepo.find({ where: { schoolId } });
  };

  /**
   * Update a single permission row. SCHOOL_ADMIN can only update rows
   * that belong to their school.
   */
  updateRolePermission = (
    id: string,
    updates: Partial<RolePermission>,
    requesterRole?: UserRole,
    requesterSchoolId?: string | null,
  ) => {
    return this.permissionRepo.findOne({ where: { id } }).then((existing) => {
      if (!existing) throw new Error('Permission not found');

      if (
        ![UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN].includes(requesterRole!)
      ) {
        throw new ForbiddenException(
          'Only administrators may configure defaults',
        );
      }
      if (
        existing.role === UserRole.SUPER_ADMIN ||
        existing.role === UserRole.SCHOOL_ADMIN
      ) {
        throw new ForbiddenException(
          'Administrator permissions are not configurable',
        );
      }
      // SCHOOL_ADMIN can only edit their own school's permissions
      if (
        requesterRole === UserRole.SCHOOL_ADMIN &&
        existing.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only update permissions for your own school',
        );
      }

      const safeUpdates = Object.fromEntries(
        ['canCreate', 'canRead', 'canUpdate', 'canDelete']
          .filter(
            (key) => typeof updates[key as keyof RolePermission] === 'boolean',
          )
          .map((key) => [key, updates[key as keyof RolePermission]]),
      );
      const roles =
        this.permissionProfile(existing.role) === UserRole.PRINCIPAL
          ? [UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.HEAD_TEACHER]
          : [existing.role];
      return this.permissionRepo
        .update(
          {
            role: In(roles),
            resource: existing.resource,
            schoolId: existing.schoolId ?? IsNull(),
          },
          safeUpdates,
        )
        .then(() => this.permissionRepo.findOne({ where: { id } }));
    });
  };

  /**
   * Seed global default permissions (schoolId = null) for ALL roles.
   * Called once on module init.
   */
  seedGlobalDefaultPermissions = () => {
    const roles = Object.values(UserRole);
    const resources = Object.values(AppResource);

    return this.permissionRepo
      .find({ where: { schoolId: IsNull() } })
      .then((existing) => {
        const existingMap = new Set(
          existing.map((p) => `${p.role}_${p.resource}`),
        );

        const toCreate: Partial<RolePermission>[] = [];

        roles.forEach((role) => {
          resources.forEach((resource) => {
            if (!existingMap.has(`${role}_${resource}`)) {
              const perms = this.getDefaultRolePermissions(role, resource);
              toCreate.push({
                role,
                resource,
                schoolId: null,
                ...perms,
              });
            }
          });
        });

        if (toCreate.length > 0) {
          const entities = this.permissionRepo.create(toCreate);
          return this.permissionRepo
            .createQueryBuilder()
            .insert()
            .values(entities)
            .orIgnore()
            .execute()
            .then(() => {
              console.log(
                `Seeded ${toCreate.length} global default permissions.`,
              );
            });
        }
        return Promise.resolve();
      });
  };

  /**
   * Seed default permissions for a specific school.
   * Creates one row per (role x resource) pair.
   */
  seedDefaultPermissions = (schoolId: string) => {
    const roles = Object.values(UserRole).filter(
      (r) => r !== UserRole.SUPER_ADMIN,
    );
    const resources = Object.values(AppResource);

    return this.permissionRepo
      .find({ where: { schoolId } })
      .then((existingPermissions) => {
        const existingMap = new Set(
          existingPermissions.map((p) => `${p.role}_${p.resource}`),
        );

        const toCreate: Partial<RolePermission>[] = [];

        roles.forEach((role) => {
          resources.forEach((resource) => {
            if (!existingMap.has(`${role}_${resource}`)) {
              const perms = this.getDefaultRolePermissions(role, resource);
              toCreate.push({
                role,
                resource,
                schoolId,
                ...perms,
              });
            }
          });
        });

        if (toCreate.length > 0) {
          const entities = this.permissionRepo.create(toCreate);
          return this.permissionRepo
            .createQueryBuilder()
            .insert()
            .values(entities)
            .orIgnore()
            .execute()
            .then(() => {
              console.log(
                `Seeded ${toCreate.length} default permissions for school ${schoolId}.`,
              );
            });
        }
        return Promise.resolve();
      });
  };
}
