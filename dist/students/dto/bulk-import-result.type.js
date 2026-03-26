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
exports.BulkImportResult = exports.FailedRow = void 0;
const graphql_1 = require("@nestjs/graphql");
const student_entity_1 = require("../entities/student.entity");
let FailedRow = class FailedRow {
    row;
    reason;
};
exports.FailedRow = FailedRow;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], FailedRow.prototype, "row", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], FailedRow.prototype, "reason", void 0);
exports.FailedRow = FailedRow = __decorate([
    (0, graphql_1.ObjectType)()
], FailedRow);
let BulkImportResult = class BulkImportResult {
    imported;
    failed;
    students;
};
exports.BulkImportResult = BulkImportResult;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], BulkImportResult.prototype, "imported", void 0);
__decorate([
    (0, graphql_1.Field)(() => [FailedRow]),
    __metadata("design:type", Array)
], BulkImportResult.prototype, "failed", void 0);
__decorate([
    (0, graphql_1.Field)(() => [student_entity_1.Student]),
    __metadata("design:type", Array)
], BulkImportResult.prototype, "students", void 0);
exports.BulkImportResult = BulkImportResult = __decorate([
    (0, graphql_1.ObjectType)()
], BulkImportResult);
//# sourceMappingURL=bulk-import-result.type.js.map