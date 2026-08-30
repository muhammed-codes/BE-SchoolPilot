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
   * On module init, seed SUPER_ADMIN global permissions (schoolId = null).
   * Per-school permissions are seeded when a school is created.
   */
  onModuleInit() {
    this.seedSuperAdminPermissions().catch((err) =>
      console.error('Error seeding SUPER_ADMIN permissions:', err),
    );
  }

  /**
   * Get permissions for a role scoped to a specific school.
   * Falls back to global rows (schoolId IS NULL) if no school-specific rows exist.
   * For SUPER_ADMIN, always returns the global rows.
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
        // Fallback to global rows if no school-specific perms seeded yet
        return this.permissionRepo.find({
          where: { role, schoolId: IsNull() },
        });
      });
  };

  /**
   * Returns all permissions for a given school (for the settings page).
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
   * Seed global SUPER_ADMIN permissions (schoolId = null).
   * Called once on module init.
   */
  seedSuperAdminPermissions = () => {
    const resources = Object.values(AppResource);

    return this.permissionRepo
      .find({ where: { role: UserRole.SUPER_ADMIN, schoolId: IsNull() } })
      .then((existing) => {
        const existingResources = new Set(existing.map((p) => p.resource));
        const toCreate = resources
          .filter((r) => !existingResources.has(r))
          .map((resource) =>
            this.permissionRepo.create({
              role: UserRole.SUPER_ADMIN,
              resource,
              schoolId: null,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
            }),
          );

        if (toCreate.length > 0) {
          return this.permissionRepo.save(toCreate).then(() => {
            console.log(
              `Seeded ${toCreate.length} SUPER_ADMIN global permissions.`,
            );
          });
        }
        return Promise.resolve();
      });
  };

  /**
   * Seed default permissions for a specific school.
   * Called when a new school is created. Creates one row per (role × resource) pair.
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
              const isAdmin = role === UserRole.SCHOOL_ADMIN;
              const isLeadership =
                isAdmin ||
                role === UserRole.PRINCIPAL ||
                role === UserRole.VICE_PRINCIPAL ||
                role === UserRole.HEAD_TEACHER;

              // Default read access
              let canRead = isLeadership;
              if (
                role === UserRole.CLASS_TEACHER ||
                role === UserRole.SUBJECT_TEACHER
              ) {
                const teacherResources: AppResource[] = [
                  AppResource.STUDENTS,
                  AppResource.ATTENDANCE,
                  AppResource.RESULTS,
                  AppResource.CLASSES,
                  AppResource.SUBJECTS,
                  AppResource.USERS,
                ];
                if (teacherResources.includes(resource)) canRead = true;
              }
              if (role === UserRole.PARENT) {
                const parentResources: AppResource[] = [
                  AppResource.RESULTS,
                  AppResource.ATTENDANCE,
                  AppResource.STUDENTS,
                ];
                if (parentResources.includes(resource)) canRead = true;
              }

              // Default update access
              let canUpdate = isAdmin;
              if (
                role === UserRole.PRINCIPAL ||
                role === UserRole.VICE_PRINCIPAL ||
                role === UserRole.HEAD_TEACHER
              ) {
                if (
                  resource === AppResource.CLASSES ||
                  resource === AppResource.RESULTS ||
                  resource === AppResource.ATTENDANCE
                ) {
                  canUpdate = true;
                }
              }
              if (role === UserRole.CLASS_TEACHER) {
                if (
                  resource === AppResource.CLASSES ||
                  resource === AppResource.RESULTS ||
                  resource === AppResource.ATTENDANCE
                ) {
                  canUpdate = true;
                }
              }
              if (role === UserRole.SUBJECT_TEACHER) {
                if (
                  resource === AppResource.RESULTS ||
                  resource === AppResource.ATTENDANCE
                ) {
                  canUpdate = true;
                }
              }

              toCreate.push({
                role,
                resource,
                schoolId,
                canCreate: isAdmin,
                canRead,
                canUpdate,
                canDelete: isAdmin,
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
}
