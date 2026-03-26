"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GqlHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
const getErrorDetails = (exception) => {
    if (exception instanceof common_1.UnauthorizedException) {
        return {
            message: exception.message || 'Unauthorized',
            code: 'UNAUTHENTICATED',
            statusCode: common_1.HttpStatus.UNAUTHORIZED,
        };
    }
    if (exception instanceof common_1.ForbiddenException) {
        return {
            message: exception.message || 'Forbidden',
            code: 'FORBIDDEN',
            statusCode: common_1.HttpStatus.FORBIDDEN,
        };
    }
    if (exception instanceof common_1.NotFoundException) {
        return {
            message: exception.message || 'Not found',
            code: 'NOT_FOUND',
            statusCode: common_1.HttpStatus.NOT_FOUND,
        };
    }
    if (exception instanceof common_1.BadRequestException) {
        const response = exception.getResponse();
        const message = typeof response === 'string'
            ? response
            : response.message || 'Bad request';
        return {
            message: Array.isArray(message) ? message.join(', ') : message,
            code: 'BAD_REQUEST',
            statusCode: common_1.HttpStatus.BAD_REQUEST,
        };
    }
    if (exception instanceof common_1.HttpException) {
        return {
            message: exception.message,
            code: 'HTTP_EXCEPTION',
            statusCode: exception.getStatus(),
        };
    }
    return {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
    };
};
let GqlHttpExceptionFilter = class GqlHttpExceptionFilter {
    catch(exception) {
        const { message, code, statusCode } = getErrorDetails(exception);
        return new graphql_1.GraphQLError(message, {
            extensions: { code, statusCode },
        });
    }
};
exports.GqlHttpExceptionFilter = GqlHttpExceptionFilter;
exports.GqlHttpExceptionFilter = GqlHttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GqlHttpExceptionFilter);
//# sourceMappingURL=gql-exception.filter.js.map