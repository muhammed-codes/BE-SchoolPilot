import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { getPermissionsByRole } from '../access';
import { UserRole } from '../enums';

type TUserContext = {
  role?: UserRole;
  permissions?: string[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate = (context: ExecutionContext): boolean => {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const requestContext = ctx.getContext<{
      req: Request & { user?: TUserContext };
    }>();
    const user = requestContext.req.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const effectivePermissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : user.role
          ? getPermissionsByRole(user.role)
          : [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      effectivePermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions',
      );
    }

    return true;
  };
}
