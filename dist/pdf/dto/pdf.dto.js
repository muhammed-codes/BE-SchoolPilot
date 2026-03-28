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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkPDFResult = exports.ReportCardItem = void 0;
const graphql_1 = require("@nestjs/graphql");
let ReportCardItem = class ReportCardItem {
    studentId;
    studentName;
    pdfUrl;
};
exports.ReportCardItem = ReportCardItem;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], ReportCardItem.prototype, "studentId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], ReportCardItem.prototype, "studentName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], ReportCardItem.prototype, "pdfUrl", void 0);
exports.ReportCardItem = ReportCardItem = __decorate([
    (0, graphql_1.ObjectType)()
], ReportCardItem);
let BulkPDFResult = class BulkPDFResult {
    totalGenerated;
    reportCards;
};
exports.BulkPDFResult = BulkPDFResult;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], BulkPDFResult.prototype, "totalGenerated", void 0);
__decorate([
    (0, graphql_1.Field)(() => [ReportCardItem]),
    __metadata("design:type", Array)
], BulkPDFResult.prototype, "reportCards", void 0);
exports.BulkPDFResult = BulkPDFResult = __decorate([
    (0, graphql_1.ObjectType)()
], BulkPDFResult);
//# sourceMappingURL=pdf.dto.js.map