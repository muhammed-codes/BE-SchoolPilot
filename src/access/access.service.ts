import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
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
    if (role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN) {
      return true;
    }
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

    const assignments = await this.userGroupRepo.find({
      where: { userId, schoolId },
    });
    if (assignments.length > 0) {
      const groupPermissions = await this.groupPermissionRepo.find({
        where: {
          schoolId,
          groupId: In(assignments.map((assignment) => assignment.groupId)),
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

  getPermissionGroups = (schoolId: string) =>
    this.groupRepo.find({ where: { schoolId }, order: { name: 'ASC' } });

  getUserPermissionGroups = (userId: string, schoolId: string) =>
    this.userGroupRepo.find({ where: { userId, schoolId } });

  getUserPermissionOverrides = (userId: string, schoolId: string) =>
    this.userPermissionRepo.find({ where: { userId, schoolId } });

  private async assertSchoolUser(userId: string, schoolId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, schoolId } });
    if (!user) throw new ForbiddenException('User does not belong to this school');
    return user;
  }

  private async assertSchoolGroup(groupId: string, schoolId: string) {
    const group = await this.groupRepo.findOne({ where: { id: groupId, schoolId } });
    if (!group) throw new ForbiddenException('Permission group does not belong to this school');
    return group;
  }

  async createPermissionGroup(
    input: { name: string; description?: string; schoolId?: string },
    schoolId: string,
  ) {
    const group = this.groupRepo.create({
      schoolId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    });
    return this.groupRepo.save(group);
  }

  async updatePermissionGroup(
    input: { id: string; name?: string; description?: string; isActive?: boolean },
    schoolId: string,
  ) {
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
    await this.assertSchoolGroup(groupId, schoolId);
    const assignments = await this.userGroupRepo.count({ where: { groupId, schoolId } });
    if (assignments > 0) {
      throw new ForbiddenException('Remove staff assignments before deleting this group');
    }
    await this.groupPermissionRepo.delete({ groupId, schoolId });
    await this.groupRepo.delete({ id: groupId, schoolId });
    return true;
  }

  async setPermissionGroupPermissions(
    groupId: string,
    permissions: { resource: AppResource; action: PermissionAction }[],
    schoolId: string,
  ) {
    await this.assertSchoolGroup(groupId, schoolId);
    await this.groupPermissionRepo.delete({ groupId, schoolId });
    if (permissions.length > 0) {
      await this.groupPermissionRepo.save(
        permissions.map((permission) =>
          this.groupPermissionRepo.create({ groupId, schoolId, ...permission }),
        ),
      );
    }
    return this.groupPermissionRepo.find({ where: { groupId, schoolId } });
  }

  getPermissionGroupPermissions = (groupId: string, schoolId: string) =>
    this.assertSchoolGroup(groupId, schoolId).then(() =>
      this.groupPermissionRepo.find({ where: { groupId, schoolId } }),
    );

  async assignPermissionGroup(userId: string, groupId: string, schoolId: string) {
    await this.assertSchoolUser(userId, schoolId);
    await this.assertSchoolGroup(groupId, schoolId);
    const existing = await this.userGroupRepo.findOne({ where: { userId, groupId } });
    if (existing) return existing;
    return this.userGroupRepo.save(this.userGroupRepo.create({ userId, groupId, schoolId }));
  }

  async removePermissionGroup(userId: string, groupId: string, schoolId: string) {
    await this.assertSchoolUser(userId, schoolId);
    await this.assertSchoolGroup(groupId, schoolId);
    await this.userGroupRepo.delete({ userId, groupId, schoolId });
    return true;
  }

  async setUserPermission(
    input: {
      userId: string;
      resource: AppResource;
      action: PermissionAction;
      effect: PermissionEffect;
    },
    schoolId: string,
  ) {
    await this.assertSchoolUser(input.userId, schoolId);
    const existing = await this.userPermissionRepo.findOne({
      where: {
        userId: input.userId,
        schoolId,
        resource: input.resource,
        action: input.action,
      },
    });
    if (existing) {
      existing.effect = input.effect;
      return this.userPermissionRepo.save(existing);
    }
    return this.userPermissionRepo.save(this.userPermissionRepo.create({ ...input, schoolId }));
  }

  async removeUserPermission(
    userId: string,
    resource: AppResource,
    action: PermissionAction,
    schoolId: string,
  ) {
    await this.assertSchoolUser(userId, schoolId);
    await this.userPermissionRepo.delete({ userId, schoolId, resource, action });
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
        `ALTER TYPE "role_permissions_role_enum" ADD VALUE IF NOT EXISTS 'bursar'`,
      );
    } catch {
      // Safe fallback if type doesn't exist yet or already has value
    }

    try {
      await this.seedGlobalDefaultPermissions();
      await this.repairExistingPermissions();
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

    // 2. PRINCIPAL: Full access to all operational & academic modules
    if (role === UserRole.PRINCIPAL) {
      const isSettings = resource === AppResource.SETTINGS;
      return {
        canRead: true,
        canCreate: !isSettings,
        canUpdate: !isSettings,
        canDelete: !isSettings,
      };
    }

    // 3. VICE_PRINCIPAL: Full access to academic & user modules
    if (role === UserRole.VICE_PRINCIPAL) {
      const isSettings = resource === AppResource.SETTINGS;
      return {
        canRead: true,
        canCreate: !isSettings,
        canUpdate: !isSettings,
        canDelete: !isSettings,
      };
    }

    // 4. HEAD_TEACHER: Academic & staff management access
    if (role === UserRole.HEAD_TEACHER) {
      const isSettings = resource === AppResource.SETTINGS;
      const canDeleteRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.STUDENTS,
      ].includes(resource);
      return {
        canRead: true,
        canCreate: !isSettings,
        canUpdate: !isSettings,
        canDelete: canDeleteRes,
      };
    }

    // 5. CLASS_TEACHER: Class management, students, attendance, results & users read
    if (role === UserRole.CLASS_TEACHER) {
      const isSettings = resource === AppResource.SETTINGS;
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
        canRead: !isSettings,
        canCreate: canCreateRes,
        canUpdate: canUpdateRes,
        canDelete: false,
      };
    }

    // 6. SUBJECT_TEACHER: Results, attendance, classes, subjects, students & users read
    if (role === UserRole.SUBJECT_TEACHER) {
      const isSettings = resource === AppResource.SETTINGS;
      const canCreateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
      ].includes(resource);
      const canUpdateRes = [
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
      ].includes(resource);
      return {
        canRead: !isSettings,
        canCreate: canCreateRes,
        canUpdate: canUpdateRes,
        canDelete: false,
      };
    }

    // BURSAR retains the existing finance role access during migration.
    if (role === UserRole.BURSAR) {
      const isFees = resource === AppResource.FEES;
      return {
        canRead: isFees,
        canCreate: isFees,
        canUpdate: isFees,
        canDelete: isFees,
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
   * Falls back to global rows (schoolId IS NULL) if no school-specific rows exist.
   * Auto-seeds school default permissions in background if missing.
   */
  getPermissionsByRole = (role: UserRole, schoolId?: string | null) => {
    if (role === UserRole.SUPER_ADMIN || !schoolId) {
      return this.permissionRepo.find({
        where: { role, schoolId: IsNull() },
      });
    }

    return this.permissionRepo
      .find({ where: { role, schoolId } })
      .then((schoolPerms) => {
        if (schoolPerms.length > 0) return schoolPerms;

        // Trigger school permission seeding in background for missing schools
        void this.seedDefaultPermissions(schoolId);

        // Fallback to global rows (schoolId IS NULL)
        return this.permissionRepo.find({
          where: { role, schoolId: IsNull() },
        });
      });
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

      // SCHOOL_ADMIN can only edit their own school's permissions
      if (
        requesterRole === UserRole.SCHOOL_ADMIN &&
        existing.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only update permissions for your own school',
        );
      }

      return this.permissionRepo
        .update(id, updates)
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
          return this.permissionRepo.save(entities).then(() => {
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
          return this.permissionRepo.save(entities).then(() => {
            console.log(
              `Seeded ${toCreate.length} default permissions for school ${schoolId}.`,
            );
          });
        }
        return Promise.resolve();
      });
  };

  /**
   * Auto-repairs existing permission rows in the DB to ensure Leadership
   * and Teachers have proper read & create access according to the latest RBAC matrix.
   */
  private repairExistingPermissions = () => {
    return this.permissionRepo.find().then((allPermissions) => {
      const updates: Promise<unknown>[] = [];

      allPermissions.forEach((p) => {
        const expected = this.getDefaultRolePermissions(p.role, p.resource);
        let needsUpdate = false;

        // If leadership or teacher should have read access but it's currently false
        if (expected.canRead && !p.canRead) {
          p.canRead = true;
          needsUpdate = true;
        }

        // If leadership should have create or update access but it's currently false
        if (
          [
            UserRole.PRINCIPAL,
            UserRole.VICE_PRINCIPAL,
            UserRole.HEAD_TEACHER,
          ].includes(p.role)
        ) {
          if (expected.canCreate && !p.canCreate) {
            p.canCreate = true;
            needsUpdate = true;
          }
          if (expected.canUpdate && !p.canUpdate) {
            p.canUpdate = true;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          updates.push(this.permissionRepo.save(p));
        }
      });

      const schoolIds = Array.from(
        new Set(
          allPermissions
            .map((p) => p.schoolId)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const seedPromises = schoolIds.map((sId) =>
        this.seedDefaultPermissions(sId),
      );

      return Promise.all([...updates, ...seedPromises]).then(() => {
        if (updates.length > 0) {
          console.log(
            `Repaired ${updates.length} existing permission records.`,
          );
        }
      });
    });
  };
}
