"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const graphql_upload_ts_1 = require("graphql-upload-ts");
const users_service_1 = require("./users.service");
const user_entity_1 = require("./entities/user.entity");
const create_user_input_1 = require("./dto/create-user.input");
const update_user_input_1 = require("./dto/update-user.input");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
const pagination_1 = require("../common/pagination");
const PaginatedUser = (0, pagination_1.createPaginatedType)(user_entity_1.User);
let UsersResolver = class UsersResolver {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    me(user) {
        return this.usersService.findById(user.sub);
    }
    user(id) {
        return this.usersService.findById(id);
    }
    schoolUsers(role, pagination, user) {
        return this.usersService.findBySchool(user.schoolId, role, pagination);
    }
    schoolTeachers(user) {
        return this.usersService.findTeachersBySchool(user.schoolId);
    }
    createUser(input, user) {
        if (user.role === enums_1.UserRole.SCHOOL_ADMIN) {
            const allowedRoles = [
                enums_1.UserRole.CLASS_TEACHER,
                enums_1.UserRole.SUBJECT_TEACHER,
                enums_1.UserRole.PARENT,
            ];
            if (!allowedRoles.includes(input.role)) {
                throw new common_1.ForbiddenException('School admins can only create teachers and parents');
            }
            return this.usersService.createUser(input, user.schoolId);
        }
        if (user.role === enums_1.UserRole.SUPER_ADMIN) {
            if (input.role !== enums_1.UserRole.SCHOOL_ADMIN) {
                throw new common_1.ForbiddenException('Super admins can only create school admins via this endpoint');
            }
            return this.usersService.createUser(input, user.schoolId);
        }
    }
    updateUser(id, input, user) {
        return this.usersService.updateUser(id, input, user.sub, user.role);
    }
    changePassword(oldPassword, newPassword, user) {
        return this.usersService.changePassword(user.sub, oldPassword, newPassword);
    }
    uploadAvatar(file, user) {
        return this.usersService.updateAvatar(user.sub, file);
    }
    deactivateUser(id, user) {
        return this.usersService.deactivateUser(id, user.sub, user.role, user.schoolId);
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "me", null);
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "user", null);
__decorate([
    (0, graphql_1.Query)(() => PaginatedUser),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('role', { type: () => enums_1.UserRole, nullable: true })),
    __param(1, (0, graphql_1.Args)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_1.PaginationArgs, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "schoolUsers", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.User]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "schoolTeachers", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_input_1.CreateUserInput, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "createUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_input_1.UpdateUserInput, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "updateUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('oldPassword')),
    __param(1, (0, graphql_1.Args)('newPassword')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "changePassword", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)({ name: 'file', type: () => graphql_upload_ts_1.GraphQLUpload })),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_upload_ts_1.Upload, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "uploadAvatar", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "deactivateUser", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_entity_1.User),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersResolver);
//# sourceMappingURL=users.resolver.js.map