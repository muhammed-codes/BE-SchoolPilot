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
    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      return {
        req: http.getRequest<Record<string, unknown>>(),
        res: http.getResponse<Record<string, unknown>>(),
      };
    }

    const ctx = GqlExecutionContext.create(context);
    const contextMap = ctx.getContext<{
      req?: Record<string, unknown>;
      res?: Record<string, unknown>;
    }>();
    const req = contextMap?.req || {};
    const res = contextMap?.res || { header: () => undefined };
    return { req, res };
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: unknown,
  ): Promise<void> {
    let ip = 'unknown';

    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      ip = http.getRequest<{ ip?: string }>()?.ip || 'unknown';
    } else {
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext<{ req?: { ip?: string } }>()?.req;
      ip = req?.ip || 'unknown';
    }

    this.logger.warn(
      `Rate limit exceeded for IP: ${ip} detail: ${JSON.stringify(throttlerLimitDetail)}`,
    );
    throw new ThrottlerException(
      'Rate limit exceeded. Please try again later.',
    );
  }
}
