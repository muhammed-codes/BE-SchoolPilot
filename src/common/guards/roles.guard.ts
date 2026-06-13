import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate = (context: ExecutionContext): boolean => {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const ctx = GqlExecutionContext.create(context);
    const requestContext = ctx.getContext<{
      req: Request & { user?: { role?: UserRole } };
    }>();
    const user = requestContext.req.user;

    // Super admin always has access
    if (user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user?.role === role);

    if (!hasRole) {
      throw new ForbiddenException('You do not have the required role');
    }

    return true;
  };
}
