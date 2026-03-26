import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
export declare class GqlHttpExceptionFilter implements GqlExceptionFilter {
    catch(exception: unknown): GraphQLError;
}
