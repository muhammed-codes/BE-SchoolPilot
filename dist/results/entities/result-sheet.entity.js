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
exports.ResultSheet = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const enums_1 = require("../../common/enums");
const score_component_config_type_1 = require("../dto/score-component-config.type");
const student_result_entity_1 = require("./student-result.entity");
let ResultSheet = class ResultSheet extends base_entity_1.BaseEntity {
    classId;
    termId;
    schoolId;
    gradingSystem;
    scoreComponents;
    status;
    returnReason;
    studentResults;
};
exports.ResultSheet = ResultSheet;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ResultSheet.prototype, "classId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ResultSheet.prototype, "termId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ResultSheet.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.GradingSystem),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.GradingSystem }),
    __metadata("design:type", String)
], ResultSheet.prototype, "gradingSystem", void 0);
__decorate([
    (0, graphql_1.Field)(() => [score_component_config_type_1.ScoreComponentConfig]),
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], ResultSheet.prototype, "scoreComponents", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.ResultStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ResultStatus, default: enums_1.ResultStatus.DRAFT }),
    __metadata("design:type", String)
], ResultSheet.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ResultSheet.prototype, "returnReason", void 0);
__decorate([
    (0, graphql_1.Field)(() => [student_result_entity_1.StudentResult], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => student_result_entity_1.StudentResult, (sr) => sr.resultSheet, { eager: false }),
    __metadata("design:type", Array)
], ResultSheet.prototype, "studentResults", void 0);
exports.ResultSheet = ResultSheet = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('result_sheets')
], ResultSheet);
//# sourceMappingURL=result-sheet.entity.js.map