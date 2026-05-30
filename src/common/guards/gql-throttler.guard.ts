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
      return { req: http.getRequest(), res: http.getResponse() };
    }
    
    const ctx = GqlExecutionContext.create(context);
    const contextMap = ctx.getContext();
    const req = contextMap.req;
    const res = contextMap.res || { header: () => undefined };
    return { req, res };
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    let ip = 'unknown';
    
    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      ip = http.getRequest().ip || 'unknown';
    } else {
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext().req;
      ip = req?.ip || 'unknown';
    }
    
    this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
    throw new ThrottlerException('Rate limit exceeded. Please try again later.');
  }
}



