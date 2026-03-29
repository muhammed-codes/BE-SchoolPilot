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
exports.TermsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const terms_service_1 = require("./terms.service");
const session_entity_1 = require("./entities/session.entity");
const term_entity_1 = require("./entities/term.entity");
const create_session_input_1 = require("./dto/create-session.input");
const create_term_input_1 = require("./dto/create-term.input");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let TermsResolver = class TermsResolver {
    termsService;
    constructor(termsService) {
        this.termsService = termsService;
    }
    activeTerm(user) {
        return this.termsService.getActiveTerm(user.schoolId);
    }
    sessions(user) {
        return this.termsService.getSessionsBySchool(user.schoolId);
    }
    termsBySession(sessionId) {
        return this.termsService.getTermsBySession(sessionId);
    }
    createSession(input, user) {
        return this.termsService.createSession(input, user.schoolId);
    }
    createTerm(input, user) {
        return this.termsService.createTerm(input, user.schoolId);
    }
    activateTerm(termId, user) {
        return this.termsService.activateTerm(termId, user.schoolId);
    }
    closeTerm(termId, user) {
        return this.termsService.closeTerm(termId, user.schoolId);
    }
    unlockTerm(termId, user) {
        return this.termsService.unlockTerm(termId, user.schoolId);
    }
    updateTotalSchoolDays(termId, days, user) {
        return this.termsService.updateTotalSchoolDays(termId, days, user.schoolId);
    }
};
exports.TermsResolver = TermsResolver;
__decorate([
    (0, graphql_1.Query)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "activeTerm", null);
__decorate([
    (0, graphql_1.Query)(() => [session_entity_1.Session]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "sessions", null);
__decorate([
    (0, graphql_1.Query)(() => [term_entity_1.Term]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "termsBySession", null);
__decorate([
    (0, graphql_1.Mutation)(() => session_entity_1.Session),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_session_input_1.CreateSessionInput, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "createSession", null);
__decorate([
    (0, graphql_1.Mutation)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_term_input_1.CreateTermInput, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "createTerm", null);
__decorate([
    (0, graphql_1.Mutation)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('termId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "activateTerm", null);
__decorate([
    (0, graphql_1.Mutation)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('termId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "closeTerm", null);
__decorate([
    (0, graphql_1.Mutation)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('termId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "unlockTerm", null);
__decorate([
    (0, graphql_1.Mutation)(() => term_entity_1.Term),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('termId')),
    __param(1, (0, graphql_1.Args)('days', { type: () => graphql_1.Int })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], TermsResolver.prototype, "updateTotalSchoolDays", null);
exports.TermsResolver = TermsResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [terms_service_1.TermsService])
], TermsResolver);
//# sourceMappingURL=terms.resolver.js.map