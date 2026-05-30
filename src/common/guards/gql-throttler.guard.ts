import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: Record<string, unknown> }>().req;
    const res = { header: () => undefined };
    return { req, res };
  }
}


