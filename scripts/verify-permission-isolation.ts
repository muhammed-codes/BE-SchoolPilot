import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../src/database/data-source';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/enums/role.enum';
import { RolePermission } from '../src/access/entities/role-permission.entity';
import { PermissionGroup } from '../src/access/entities/permission-group.entity';
import { PermissionGroupPermission } from '../src/access/entities/permission-group-permission.entity';
import { UserPermissionGroup } from '../src/access/entities/user-permission-group.entity';
import { UserPermission } from '../src/access/entities/user-permission.entity';
import { PermissionAuditLog } from '../src/access/entities/permission-audit-log.entity';
import { AccessService } from '../src/access/access.service';
import { AppResource } from '../src/access/enums/resource.enum';
import { PermissionAction } from '../src/access/enums/permission-action.enum';
import { PermissionEffect } from '../src/access/enums/permission-effect.enum';

type IdRow = { id: string };

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  const testUrl = process.env.MIGRATION_TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      'Set MIGRATION_TEST_DATABASE_URL to an isolated test database',
    );
  }
  const databaseName = new URL(testUrl).pathname.replace(/^\//, '');
  if (!/test/i.test(databaseName)) {
    throw new Error('Refusing permission verification outside a test database');
  }

  const dataSource = new DataSource({
    ...dataSourceOptions,
    type: 'postgres',
    url: testUrl,
    ssl: process.env.DATABASE_SSL === 'false' ? false : undefined,
  } as never);
  await dataSource.initialize();
  try {
    await dataSource.runMigrations({ transaction: 'each' });

    const schoolARows: unknown = await dataSource.query(
      `INSERT INTO "schools" ("name", "uniqueQrCode") VALUES ('SchoolRight Permission Test A', $1) RETURNING "id"`,
      [`permission-test-a-${Date.now()}`],
    );
    const schoolBRows: unknown = await dataSource.query(
      `INSERT INTO "schools" ("name", "uniqueQrCode") VALUES ('SchoolRight Permission Test B', $1) RETURNING "id"`,
      [`permission-test-b-${Date.now()}`],
    );
    const schoolA = schoolARows as IdRow[];
    const schoolB = schoolBRows as IdRow[];
    const schoolAId = schoolA[0].id;
    const schoolBId = schoolB[0].id;

    const userRepo = dataSource.getRepository(User);
    const staffA = await userRepo.save(
      userRepo.create({
        email: `permission-staff-a-${Date.now()}@test.invalid`,
        firstName: 'Permission',
        lastName: 'Staff A',
        passwordHash: 'test-only-hash',
        role: UserRole.CLASS_TEACHER,
        schoolId: schoolAId,
      }),
    );
    const staffB = await userRepo.save(
      userRepo.create({
        email: `permission-staff-b-${Date.now()}@test.invalid`,
        firstName: 'Permission',
        lastName: 'Staff B',
        passwordHash: 'test-only-hash',
        role: UserRole.CLASS_TEACHER,
        schoolId: schoolBId,
      }),
    );
    const adminA = await userRepo.save(
      userRepo.create({
        email: `permission-admin-a-${Date.now()}@test.invalid`,
        firstName: 'Test',
        lastName: 'Admin',
        passwordHash: 'test-only-hash',
        role: UserRole.SCHOOL_ADMIN,
        schoolId: schoolAId,
      }),
    );

    const roleRepo = dataSource.getRepository(RolePermission);
    for (const schoolId of [schoolAId, schoolBId]) {
      await roleRepo.save([
        roleRepo.create({
          role: UserRole.CLASS_TEACHER,
          schoolId,
          resource: AppResource.RESULTS,
          canRead: true,
          canUpdate: true,
          canCreate: false,
          canDelete: false,
        }),
      ]);
    }

    const accessService = new AccessService(
      roleRepo,
      dataSource.getRepository(PermissionGroup),
      dataSource.getRepository(PermissionGroupPermission),
      dataSource.getRepository(UserPermissionGroup),
      dataSource.getRepository(UserPermission),
      userRepo,
      dataSource.getRepository(PermissionAuditLog),
    );

    const groupA = await accessService.createPermissionGroup(
      { name: 'Accounting' },
      schoolAId,
      adminA.id,
    );
    await accessService.setPermissionGroupPermissions(
      groupA.id,
      [{ resource: AppResource.FEES, action: PermissionAction.READ }],
      schoolAId,
      adminA.id,
    );
    await accessService.assignPermissionGroup(
      staffA.id,
      groupA.id,
      schoolAId,
      adminA.id,
    );

    assert(
      await accessService.hasPermission(
        staffA.id,
        staffA.role,
        schoolAId,
        AppResource.FEES,
        PermissionAction.READ,
      ),
      'Group grant did not add the Fees read permission in its school',
    );
    assert(
      !(await accessService.hasPermission(
        staffB.id,
        staffB.role,
        schoolBId,
        AppResource.FEES,
        PermissionAction.READ,
      )),
      'School A group grant leaked into School B',
    );

    await accessService.setUserPermission(
      {
        userId: staffA.id,
        resource: AppResource.RESULTS,
        action: PermissionAction.UPDATE,
        effect: PermissionEffect.DENY,
      },
      schoolAId,
      adminA.id,
    );
    assert(
      !(await accessService.hasPermission(
        staffA.id,
        staffA.role,
        schoolAId,
        AppResource.RESULTS,
        PermissionAction.UPDATE,
      )),
      'Individual Deny did not override the base role grant',
    );
    assert(
      await accessService.hasPermission(
        staffB.id,
        staffB.role,
        schoolBId,
        AppResource.RESULTS,
        PermissionAction.UPDATE,
      ),
      'School A individual Deny changed School B access',
    );

    await accessService.removeUserPermission(
      staffA.id,
      AppResource.RESULTS,
      PermissionAction.UPDATE,
      schoolAId,
      adminA.id,
    );
    assert(
      await accessService.hasPermission(
        staffA.id,
        staffA.role,
        schoolAId,
        AppResource.RESULTS,
        PermissionAction.UPDATE,
      ),
      'Reset to Inherit did not restore the base role grant',
    );

    const groupB = await accessService.createPermissionGroup(
      { name: 'School B Accounting' },
      schoolBId,
      adminA.id,
    );
    let crossSchoolAssignmentDenied = false;
    try {
      await accessService.assignPermissionGroup(
        staffA.id,
        groupB.id,
        schoolAId,
        adminA.id,
      );
    } catch {
      crossSchoolAssignmentDenied = true;
    }
    assert(
      crossSchoolAssignmentDenied,
      'Cross-school group assignment was accepted',
    );

    const auditCount = await dataSource
      .getRepository(PermissionAuditLog)
      .count({
        where: { schoolId: schoolAId, actorUserId: adminA.id },
      });
    assert(
      auditCount >= 5,
      'Permission changes were not recorded in the audit log',
    );

    console.log('Tenant permission isolation verification passed.');
  } finally {
    await dataSource.destroy();
  }
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
