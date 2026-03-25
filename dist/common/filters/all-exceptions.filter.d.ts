import { ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
export declare class AllExceptionsFilter implements GqlExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): {
        statusCode: number;
        message: string;
    };
}
