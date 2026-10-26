import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { RolesGuard } from './roles.guard';
import { AccessService } from '../../access/access.service';
import { RecordScopeService } from '../../access/record-scope.service';
import { UserRole } from '../enums/role.enum';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';

const context = (user?: unknown) =>
  ({
    getType: () => 'http',
    getHandler: () => function student() {},
    getClass: () => class Controller {},
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user, body: { studentId: 'foreign' } }),
    }),
  }) as unknown as ExecutionContext;

describe('authorization guards', () => {
  const reflect = (permission?: unknown, roles?: UserRole[]) =>
    ({
      getAllAndOverride: jest.fn((key: string) =>
        key === PERMISSION_KEY
          ? permission
          : key === ROLES_KEY
            ? roles
            : undefined,
      ),
    }) as unknown as Reflector;
  it('fails closed without authorization metadata', async () => {
    const guard = new PermissionGuard(
      reflect(),
      {} as AccessService,
      {} as RecordScopeService,
    );
    await expect(guard.canActivate(context())).resolves.toBe(false);
    expect(new RolesGuard(reflect()).canActivate(context())).toBe(false);
  });
  it('does not authorize an anonymous REST request', async () => {
    const guard = new PermissionGuard(
      reflect({
        resource: AppResource.STUDENTS,
        action: PermissionAction.READ,
      }),
      {} as AccessService,
      {} as RecordScopeService,
    );
    await expect(guard.canActivate(context())).resolves.toBe(false);
  });
  it('enforces ownership for school administrators before the module exemption', async () => {
    const hasPermission = jest.fn().mockResolvedValue(true);
    const assertArguments = jest
      .fn()
      .mockRejectedValue(new Error('foreign school'));
    const guard = new PermissionGuard(
      reflect({
        resource: AppResource.STUDENTS,
        action: PermissionAction.READ,
      }),
      { hasPermission } as unknown as AccessService,
      { assertArguments } as unknown as RecordScopeService,
    );
    await expect(
      guard.canActivate(
        context({
          sub: 'admin',
          role: UserRole.SCHOOL_ADMIN,
          schoolId: 'school-a',
        }),
      ),
    ).rejects.toThrow('foreign school');
    expect(hasPermission).not.toHaveBeenCalled();
  });
  it('checks roles on REST requests', () => {
    const guard = new RolesGuard(reflect(undefined, [UserRole.SCHOOL_ADMIN]));
    expect(() =>
      guard.canActivate(context({ role: UserRole.CLASS_TEACHER })),
    ).toThrow();
    expect(guard.canActivate(context({ role: UserRole.SCHOOL_ADMIN }))).toBe(
      true,
    );
  });
});
