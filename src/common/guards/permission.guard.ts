import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AppResource } from '../../access/enums/resource.enum';
import {
  ActionType,
  PERMISSION_KEY,
} from '../decorators/require-permission.decorator';
import { AccessService } from '../../access/access.service';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessService: AccessService,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      resource: AppResource;
      action: ActionType;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return Promise.resolve(true); // No permission required
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    if (!user) {
      return Promise.resolve(false);
    }

    // Super admin always has access
    if (user.role === UserRole.SUPER_ADMIN) {
      return Promise.resolve(true);
    }

    return this.accessService
      .getPermissionsByRole(user.role)
      .then((permissions) => {
        const permission = permissions.find(
          (p) => p.resource === requiredPermission.resource,
        );

        if (!permission) {
          return false;
        }

        return permission[requiredPermission.action] === true;
      });
  }
}
