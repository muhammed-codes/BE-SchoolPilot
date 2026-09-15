import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  GqlExceptionFilter,
  GqlArgumentsHost,
  GqlContextType,
} from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    if (host.getType<GqlContextType>() === 'graphql') {
      const gqlHost = GqlArgumentsHost.create(host);
      const ctx = gqlHost.getContext<{ req?: { url?: string; ip?: string } }>();
      const req = ctx?.req;
      const requestPath = req?.url || 'GraphQL';
      const requestIp = req?.ip || 'unknown';

      this.logger.error(
        `GraphQL Error - Path: ${requestPath} - IP: ${requestIp} - Status: ${status} - Message: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      return exception; // GraphQL handles formatting
    }

    // Handle standard HTTP errors
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status?: (s: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ url?: string; ip?: string }>();

    this.logger.error(
      `HTTP Error - Path: ${request?.url} - IP: ${request?.ip} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    if (response && typeof response.status === 'function') {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request?.url,
        message,
      });
    } else {
      return exception;
    }
  }
}
