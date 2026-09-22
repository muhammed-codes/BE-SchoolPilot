/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

import { AccessService } from './access.service';
import { AppResource } from './enums/resource.enum';
import { PermissionAction } from './enums/permission-action.enum';
import { PermissionEffect } from './enums/permission-effect.enum';
import { UserRole } from '../common/enums/role.enum';

const repository = (rows: any[] = []) => ({
  find: jest.fn(async ({ where }: any = {}) =>
    rows.filter((row) =>
      Object.entries(where || {}).every(([key, value]: [string, any]) =>
        value && value._type === 'in'
          ? value._value.includes(row[key])
          : row[key] === value,
      ),
    ),
  ),
  findOne: jest.fn(
    async ({ where }: any = {}) =>
      rows.find((row) =>
        Object.entries(where || {}).every(([key, value]: [string, any]) =>
          value && value._type === 'in'
            ? value._value.includes(row[key])
            : row[key] === value,
        ),
      ) || null,
  ),
  create: jest.fn((input: any) => input),
  save: jest.fn(async (input: any) => input),
});

describe('AccessService effective permissions', () => {
  const makeService = (
    config: {
      rolePermissions?: any[];
      groupAssignments?: any[];
      groupPermissions?: any[];
      userPermissions?: any[];
      users?: any[];
    } = {},
  ) =>
    new AccessService(
      repository(config.rolePermissions) as any,
      repository() as any,
      repository(config.groupPermissions) as any,
      repository(config.groupAssignments) as any,
      repository(config.userPermissions) as any,
      repository(
        config.users || [{ id: 'user-a', schoolId: 'school-a' }],
      ) as any,
    );

  it('allows School Admin without stored permission rows', async () => {
    const service = makeService();

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SCHOOL_ADMIN,
        'school-a',
        AppResource.FEES,
        PermissionAction.APPROVE,
      ),
    ).resolves.toBe(true);
  });

  it('denies staff without a role, group, or individual permission', async () => {
    const service = makeService();

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SUBJECT_TEACHER,
        'school-a',
        AppResource.FEES,
        PermissionAction.READ,
      ),
    ).resolves.toBe(false);
  });

  it('preserves legacy role read permissions during migration', async () => {
    const service = makeService({
      rolePermissions: [
        {
          role: UserRole.SUBJECT_TEACHER,
          resource: AppResource.RESULTS,
          schoolId: 'school-a',
          canRead: true,
        },
      ],
    });

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SUBJECT_TEACHER,
        'school-a',
        AppResource.RESULTS,
        PermissionAction.READ,
      ),
    ).resolves.toBe(true);
  });

  it('allows a permission inherited from an assigned group', async () => {
    const service = makeService({
      groupAssignments: [
        { userId: 'user-a', groupId: 'group-a', schoolId: 'school-a' },
      ],
      groupPermissions: [
        {
          groupId: 'group-a',
          schoolId: 'school-a',
          resource: AppResource.FEES,
          action: PermissionAction.READ,
        },
      ],
    });

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SUBJECT_TEACHER,
        'school-a',
        AppResource.FEES,
        PermissionAction.READ,
      ),
    ).resolves.toBe(true);
  });

  it('lets an individual grant add access and a deny override it', async () => {
    const service = makeService({
      userPermissions: [
        {
          userId: 'user-a',
          schoolId: 'school-a',
          resource: AppResource.RESULTS,
          action: PermissionAction.APPROVE,
          effect: PermissionEffect.DENY,
        },
      ],
    });

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SUBJECT_TEACHER,
        'school-a',
        AppResource.RESULTS,
        PermissionAction.APPROVE,
      ),
    ).resolves.toBe(false);
  });

  it("does not use another school's group assignment", async () => {
    const service = makeService({
      groupAssignments: [
        { userId: 'user-a', groupId: 'group-b', schoolId: 'school-b' },
      ],
      groupPermissions: [
        {
          groupId: 'group-b',
          schoolId: 'school-b',
          resource: AppResource.FEES,
          action: PermissionAction.READ,
        },
      ],
    });

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.SUBJECT_TEACHER,
        'school-a',
        AppResource.FEES,
        PermissionAction.READ,
      ),
    ).resolves.toBe(false);
  });

  it('returns target-user effective permissions only inside the requested school', async () => {
    const service = makeService({
      users: [
        { id: 'staff-1', role: UserRole.CLASS_TEACHER, schoolId: 'school-a' },
      ],
      rolePermissions: [
        {
          role: UserRole.CLASS_TEACHER,
          schoolId: 'school-a',
          resource: AppResource.STUDENTS,
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        },
      ],
    });

    const effective = await service.getEffectivePermissionsForUser(
      'staff-1',
      'school-a',
    );

    expect(
      effective.find(
        (permission) =>
          permission.resource === AppResource.STUDENTS &&
          permission.action === PermissionAction.READ,
      )?.allowed,
    ).toBe(true);
  });
});
