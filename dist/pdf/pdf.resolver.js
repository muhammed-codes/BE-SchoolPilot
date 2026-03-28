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
exports.PdfResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const pdf_service_1 = require("./pdf.service");
const pdf_dto_1 = require("./dto/pdf.dto");
const guards_1 = require("../common/guards");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let PdfResolver = class PdfResolver {
    pdfService;
    constructor(pdfService) {
        this.pdfService = pdfService;
    }
    generateReportCard(studentResultId) {
        return this.pdfService.generateReportCard(studentResultId);
    }
    generateBulkReportCards(resultSheetId) {
        return this.pdfService.generateBulkReportCards(resultSheetId);
    }
};
exports.PdfResolver = PdfResolver;
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('studentResultId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PdfResolver.prototype, "generateReportCard", null);
__decorate([
    (0, graphql_1.Mutation)(() => pdf_dto_1.BulkPDFResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('resultSheetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PdfResolver.prototype, "generateBulkReportCards", null);
exports.PdfResolver = PdfResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [pdf_service_1.PdfService])
], PdfResolver);
//# sourceMappingURL=pdf.resolver.js.map