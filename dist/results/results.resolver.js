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
exports.ResultsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const results_service_1 = require("./results.service");
const result_sheet_entity_1 = require("./entities/result-sheet.entity");
const student_result_entity_1 = require("./entities/student-result.entity");
const subject_score_entity_1 = require("./entities/subject-score.entity");
const create_result_sheet_input_1 = require("./dto/create-result-sheet.input");
const save_subject_scores_input_1 = require("./dto/save-subject-scores.input");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let ResultsResolver = class ResultsResolver {
    resultsService;
    constructor(resultsService) {
        this.resultsService = resultsService;
    }
    resultSheet(id, user) {
        return this.resultsService.getResultSheet(id, user.schoolId);
    }
    resultSheetsByClass(classId, termId, user) {
        return this.resultsService.getResultSheetsByClass(classId, termId, user.schoolId);
    }
    pendingPrincipalApprovals(user) {
        return this.resultsService.getPendingApprovals(user.schoolId);
    }
    schoolResultSheets(status, user) {
        return this.resultsService.getSchoolResultSheets(user.schoolId, status);
    }
    studentResult(studentId, termId) {
        return this.resultsService.getStudentResult(studentId, termId);
    }
    mySubjectScores(resultSheetId, user) {
        return this.resultsService.getMySubjectScores(user.sub, resultSheetId);
    }
    createResultSheet(input, user) {
        return this.resultsService.createResultSheet(input, user.sub, user.schoolId);
    }
    saveSubjectScores(input, user) {
        return this.resultsService.saveSubjectScores(input, user.sub);
    }
    submitForAdminReview(resultSheetId, user) {
        return this.resultsService.submitForAdminReview(resultSheetId, user.sub);
    }
    submitForPrincipalApproval(resultSheetId, user) {
        return this.resultsService.submitForPrincipalApproval(resultSheetId, user.sub);
    }
    approveResult(resultSheetId, user) {
        return this.resultsService.approveResult(resultSheetId, user.sub);
    }
    returnResult(resultSheetId, reason, user) {
        return this.resultsService.returnResult(resultSheetId, user.sub, reason);
    }
    saveTeacherRemark(subjectScoreId, remark) {
        return this.resultsService.saveTeacherRemark(subjectScoreId, remark);
    }
    savePrincipalRemark(studentResultId, remark) {
        return this.resultsService.savePrincipalRemark(studentResultId, remark);
    }
    saveClassTeacherRemark(studentResultId, remark) {
        return this.resultsService.saveClassTeacherRemark(studentResultId, remark);
    }
};
exports.ResultsResolver = ResultsResolver;
__decorate([
    (0, graphql_1.Query)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "resultSheet", null);
__decorate([
    (0, graphql_1.Query)(() => [result_sheet_entity_1.ResultSheet]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, graphql_1.Args)('termId')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "resultSheetsByClass", null);
__decorate([
    (0, graphql_1.Query)(() => [result_sheet_entity_1.ResultSheet]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PRINCIPAL),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "pendingPrincipalApprovals", null);
__decorate([
    (0, graphql_1.Query)(() => [result_sheet_entity_1.ResultSheet]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PRINCIPAL, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('status', { type: () => String, nullable: true })),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "schoolResultSheets", null);
__decorate([
    (0, graphql_1.Query)(() => student_result_entity_1.StudentResult, { nullable: true }),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PARENT, enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('termId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "studentResult", null);
__decorate([
    (0, graphql_1.Query)(() => [subject_score_entity_1.SubjectScore]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUBJECT_TEACHER, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "mySubjectScores", null);
__decorate([
    (0, graphql_1.Mutation)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_result_sheet_input_1.CreateResultSheetInput, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "createResultSheet", null);
__decorate([
    (0, graphql_1.Mutation)(() => [subject_score_entity_1.SubjectScore]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUBJECT_TEACHER, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [save_subject_scores_input_1.SaveSubjectScoresInput, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "saveSubjectScores", null);
__decorate([
    (0, graphql_1.Mutation)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "submitForAdminReview", null);
__decorate([
    (0, graphql_1.Mutation)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "submitForPrincipalApproval", null);
__decorate([
    (0, graphql_1.Mutation)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "approveResult", null);
__decorate([
    (0, graphql_1.Mutation)(() => result_sheet_entity_1.ResultSheet),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __param(1, (0, graphql_1.Args)('reason')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "returnResult", null);
__decorate([
    (0, graphql_1.Mutation)(() => subject_score_entity_1.SubjectScore),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SUBJECT_TEACHER),
    __param(0, (0, graphql_1.Args)('subjectScoreId')),
    __param(1, (0, graphql_1.Args)('remark')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "saveTeacherRemark", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_result_entity_1.StudentResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('studentResultId')),
    __param(1, (0, graphql_1.Args)('remark')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "savePrincipalRemark", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_result_entity_1.StudentResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('studentResultId')),
    __param(1, (0, graphql_1.Args)('remark')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResultsResolver.prototype, "saveClassTeacherRemark", null);
exports.ResultsResolver = ResultsResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [results_service_1.ResultsService])
], ResultsResolver);
//# sourceMappingURL=results.resolver.js.map