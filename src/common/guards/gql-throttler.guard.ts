import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(GqlThrottlerGuard.name);

  getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: Record<string, unknown> }>().req;
    const res = { header: () => undefined };
    return { req, res };
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: { ip: string } }>().req;
    this.logger.warn(`Rate limit exceeded for IP: ${req?.ip || 'unknown'}`);
    throw new ThrottlerException();
  }
}



