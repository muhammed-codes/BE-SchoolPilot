import { RecordScopeService } from '../../access/record-scope.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AppResource } from '../../access/enums/resource.enum';
import {
  ActionType,
  PERMISSION_KEY,
} from '../decorators/require-permission.decorator';
import { AccessService } from '../../access/access.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessService: AccessService,
    private recordScope: RecordScopeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      resource: AppResource;
      action: ActionType;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      return Promise.resolve(Boolean(roles?.length));
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<{
      req?: { user?: { sub: string; role: UserRole; schoolId?: string } };
    }>();
    const user =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest<{
            user?: { sub: string; role: UserRole; schoolId?: string };
          }>().user
        : gqlContext?.req?.user;

    if (!user) {
      return Promise.resolve(false);
    }

    // Super admin always has access
    if (user.role === UserRole.SUPER_ADMIN) {
      return Promise.resolve(true);
    }

    await this.recordScope.assertArguments(
      user,
      requiredPermission.resource,
      context.getType() === 'http'
        ? context.switchToHttp().getRequest<{ body: Record<string, unknown> }>()
            .body
        : ctx.getArgs<Record<string, unknown>>(),
      context.getHandler().name,
    );
    return this.accessService.hasPermission(
      user.sub,
      user.role,
      user.schoolId,
      requiredPermission.resource,
      requiredPermission.action,
    );
  }
}
