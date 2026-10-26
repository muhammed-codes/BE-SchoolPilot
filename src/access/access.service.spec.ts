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
      groups?: any[];
      groupAssignments?: any[];
      groupPermissions?: any[];
      userPermissions?: any[];
      users?: any[];
    } = {},
  ) =>
    new AccessService(
      repository(config.rolePermissions) as any,
      repository(config.groups) as any,
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

  it('does not grant Bursar finance actions outside effective permissions', async () => {
    const service = makeService();

    await expect(
      service.hasPermission(
        'user-a',
        UserRole.BURSAR,
        'school-a',
        AppResource.FEES,
        PermissionAction.APPROVE,
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
      groups: [{ id: 'group-a', schoolId: 'school-a', isActive: true }],
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
  it.each([UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.HEAD_TEACHER])(
    'uses School Management defaults for %s',
    async (role) => {
      const service = makeService({
        rolePermissions: [
          {
            role: UserRole.PRINCIPAL,
            schoolId: 'school-a',
            resource: AppResource.RESULTS,
            canRead: true,
          },
        ],
      });
      expect(
        await service.hasPermission(
          'user-a',
          role,
          'school-a',
          AppResource.RESULTS,
          PermissionAction.READ,
        ),
      ).toBe(true);
      expect(
        await service.hasPermission(
          'user-a',
          role,
          'school-b',
          AppResource.RESULTS,
          PermissionAction.READ,
        ),
      ).toBe(false);
    },
  );

  it.each([false, true])(
    'respects group active state %s and explicit DENY',
    async (isActive) => {
      const config = {
        groups: [{ id: 'group-a', schoolId: 'school-a', isActive }],
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
      };
      const service = makeService(config);
      expect(
        await service.hasPermission(
          'user-a',
          UserRole.CLASS_TEACHER,
          'school-a',
          AppResource.FEES,
          PermissionAction.READ,
        ),
      ).toBe(isActive);
      const denied = makeService({
        ...config,
        userPermissions: [
          {
            userId: 'user-a',
            schoolId: 'school-a',
            resource: AppResource.FEES,
            action: PermissionAction.READ,
            effect: PermissionEffect.DENY,
          },
        ],
      });
      expect(
        await denied.hasPermission(
          'user-a',
          UserRole.CLASS_TEACHER,
          'school-a',
          AppResource.FEES,
          PermissionAction.READ,
        ),
      ).toBe(false);
      const effective = await denied.getEffectivePermissions(
        'user-a',
        UserRole.CLASS_TEACHER,
        'school-a',
      );
      expect(
        effective.find(
          (p) =>
            p.resource === AppResource.FEES &&
            p.action === PermissionAction.READ,
        )?.allowed,
      ).toBe(false);
    },
  );

  it('does not grant school admin access without a school', async () => {
    expect(
      await makeService().hasPermission(
        'user-a',
        UserRole.SCHOOL_ADMIN,
        null,
        AppResource.FEES,
        PermissionAction.READ,
      ),
    ).toBe(false);
  });
});
