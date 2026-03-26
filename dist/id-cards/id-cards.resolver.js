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
exports.IdCardsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const id_cards_service_1 = require("./id-cards.service");
const bulk_card_result_type_1 = require("./dto/bulk-card-result.type");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let IdCardsResolver = class IdCardsResolver {
    idCardsService;
    constructor(idCardsService) {
        this.idCardsService = idCardsService;
    }
    generateStudentCard(studentId, user) {
        return this.idCardsService.generateStudentCard(studentId, user.schoolId);
    }
    generateBulkStudentCards(classId, user) {
        return this.idCardsService.generateBulkStudentCards(classId, user.schoolId);
    }
    generateStaffCard(userId, user) {
        return this.idCardsService.generateStaffCard(userId, user.schoolId);
    }
    generateBulkStaffCards(user) {
        return this.idCardsService.generateBulkStaffCards(user.schoolId);
    }
};
exports.IdCardsResolver = IdCardsResolver;
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdCardsResolver.prototype, "generateStudentCard", null);
__decorate([
    (0, graphql_1.Mutation)(() => bulk_card_result_type_1.BulkCardResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdCardsResolver.prototype, "generateBulkStudentCards", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdCardsResolver.prototype, "generateStaffCard", null);
__decorate([
    (0, graphql_1.Mutation)(() => bulk_card_result_type_1.BulkCardResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdCardsResolver.prototype, "generateBulkStaffCards", null);
exports.IdCardsResolver = IdCardsResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [id_cards_service_1.IdCardsService])
], IdCardsResolver);
//# sourceMappingURL=id-cards.resolver.js.map