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
exports.SchoolsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const graphql_upload_ts_1 = require("graphql-upload-ts");
const schools_service_1 = require("./schools.service");
const school_entity_1 = require("./entities/school.entity");
const create_school_input_1 = require("./dto/create-school.input");
const update_school_input_1 = require("./dto/update-school.input");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
const pagination_1 = require("../common/pagination");
const PaginatedSchool = (0, pagination_1.createPaginatedType)(school_entity_1.School);
let SchoolsResolver = class SchoolsResolver {
    schoolsService;
    constructor(schoolsService) {
        this.schoolsService = schoolsService;
    }
    schools(pagination) {
        return this.schoolsService.findAll(pagination);
    }
    school(id) {
        return this.schoolsService.findById(id);
    }
    mySchool(user) {
        if (!user.schoolId) {
            throw new common_1.ForbiddenException('No school assigned to your account');
        }
        return this.schoolsService.findById(user.schoolId);
    }
    createSchool(input) {
        return this.schoolsService.createSchool(input);
    }
    updateSchool(id, input, user) {
        if (user.role === enums_1.UserRole.SCHOOL_ADMIN && user.schoolId !== id) {
            throw new common_1.ForbiddenException('You can only update your own school');
        }
        return this.schoolsService.updateSchool(id, input);
    }
    uploadSchoolLogo(schoolId, file, user) {
        if (user.role === enums_1.UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('You can only upload logo for your own school');
        }
        return this.schoolsService.uploadLogo(schoolId, file);
    }
    uploadSchoolStamp(schoolId, file, user) {
        if (user.role === enums_1.UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('You can only upload stamp for your own school');
        }
        return this.schoolsService.uploadStamp(schoolId, file);
    }
    deactivateSchool(id) {
        return this.schoolsService.deactivateSchool(id);
    }
    regenerateQrCode(schoolId, user) {
        if (user.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('You can only regenerate QR for your own school');
        }
        return this.schoolsService.regenerateQrCode(schoolId);
    }
};
exports.SchoolsResolver = SchoolsResolver;
__decorate([
    (0, graphql_1.Query)(() => PaginatedSchool),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN),
    __param(0, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationArgs]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "schools", null);
__decorate([
    (0, graphql_1.Query)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "school", null);
__decorate([
    (0, graphql_1.Query)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "mySchool", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_school_input_1.CreateSchoolInput]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "createSchool", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_school_input_1.UpdateSchoolInput, Object]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "updateSchool", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('schoolId')),
    __param(1, (0, graphql_1.Args)({ name: 'file', type: () => graphql_upload_ts_1.GraphQLUpload })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, graphql_upload_ts_1.Upload, Object]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "uploadSchoolLogo", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('schoolId')),
    __param(1, (0, graphql_1.Args)({ name: 'file', type: () => graphql_upload_ts_1.GraphQLUpload })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, graphql_upload_ts_1.Upload, Object]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "uploadSchoolStamp", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUPER_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "deactivateSchool", null);
__decorate([
    (0, graphql_1.Mutation)(() => school_entity_1.School),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('schoolId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolsResolver.prototype, "regenerateQrCode", null);
exports.SchoolsResolver = SchoolsResolver = __decorate([
    (0, graphql_1.Resolver)(() => school_entity_1.School),
    __metadata("design:paramtypes", [schools_service_1.SchoolsService])
], SchoolsResolver);
//# sourceMappingURL=schools.resolver.js.map