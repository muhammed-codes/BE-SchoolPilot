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
import { GraphQLError } from 'graphql';

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
        : 'Something went wrong. Please try again later.';

    if (host.getType<GqlContextType>() === 'graphql') {
      const gqlHost = GqlArgumentsHost.create(host);
      const ctx = gqlHost.getContext<{ req?: { url?: string; ip?: string } }>();
      const req = ctx?.req;
      const requestPath = req?.url || 'GraphQL';
      const requestIp = req?.ip || 'unknown';

      const userFriendlyMessage = message || 'Something went wrong. Please try again.';

      this.logger.error(
        `GraphQL Error - Path: ${requestPath} - IP: ${requestIp} - Status: ${status} - Message: ${userFriendlyMessage}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      return new GraphQLError(userFriendlyMessage, {
        extensions: { code: 'INTERNAL_ERROR' },
      });
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
