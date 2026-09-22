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
    const gqlContext = ctx.getContext<{
      req?: { user?: { sub: string; role: UserRole; schoolId?: string } };
    }>();
    const user = gqlContext?.req?.user;

    if (!user) {
      return Promise.resolve(false);
    }

    // Super admin always has access
    if (user.role === UserRole.SUPER_ADMIN) {
      return Promise.resolve(true);
    }

    return this.accessService.hasPermission(
      user.sub,
      user.role,
      user.schoolId,
      requiredPermission.resource,
      requiredPermission.action,
    );
  }
}
