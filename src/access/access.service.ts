import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../common/enums/role.enum';
import { AppResource } from './enums/resource.enum';

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(
    @InjectRepository(RolePermission)
    private readonly permissionRepo: Repository<RolePermission>,
  ) {}

  /**
   * On module init, seed global default permissions (schoolId = null) for ALL roles,
   * and repair existing rows if necessary.
   */
  onModuleInit() {
    this.seedGlobalDefaultPermissions()
      .then(() => this.repairExistingPermissions())
      .catch((err) =>
        console.error('Error initializing permissions in AccessService:', err),
      );
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

    // 7. PARENT: Read-only access to children's academic info
    if (role === UserRole.PARENT) {
      const parentReadRes = [
        AppResource.STUDENTS,
        AppResource.RESULTS,
        AppResource.ATTENDANCE,
        AppResource.CLASSES,
        AppResource.SUBJECTS,
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
    return this.permissionRepo
      .findOne({ where: { id } })
      .then((existing) => {
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

      if (updates.length > 0) {
        return Promise.all(updates).then(() => {
          console.log(`Repaired ${updates.length} existing permission records.`);
        });
      }
      return Promise.resolve();
    });
  };
}
