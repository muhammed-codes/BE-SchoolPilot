import {
  Catch,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

const getErrorDetails = (exception: unknown) => {
  if (exception instanceof UnauthorizedException) {
    return {
      message: exception.message || 'Unauthorized',
      code: 'UNAUTHENTICATED',
      statusCode: HttpStatus.UNAUTHORIZED,
    };
  }

  if (exception instanceof ForbiddenException) {
    return {
      message: exception.message || 'Forbidden',
      code: 'FORBIDDEN',
      statusCode: HttpStatus.FORBIDDEN,
    };
  }

  if (exception instanceof NotFoundException) {
    return {
      message: exception.message || 'Not found',
      code: 'NOT_FOUND',
      statusCode: HttpStatus.NOT_FOUND,
    };
  }

  if (exception instanceof BadRequestException) {
    const response = exception.getResponse();
    const message =
      typeof response === 'string'
        ? response
        : (response as any).message || 'Bad request';

    return {
      message: Array.isArray(message) ? message.join(', ') : message,
      code: 'BAD_REQUEST',
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }

  if (exception instanceof HttpException) {
    return {
      message: exception.message,
      code: 'HTTP_EXCEPTION',
      statusCode: exception.getStatus(),
    };
  }

  return {
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };
};

@Catch()
export class GqlHttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown) {
    const { message, code, statusCode } = getErrorDetails(exception);

    return new GraphQLError(message, {
      extensions: { code, statusCode },
    });
  }
}
