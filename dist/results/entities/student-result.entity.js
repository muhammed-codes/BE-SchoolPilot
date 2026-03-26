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
exports.StudentResult = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const result_sheet_entity_1 = require("./result-sheet.entity");
const subject_score_entity_1 = require("./subject-score.entity");
const component_score_type_1 = require("../dto/component-score.type");
let StudentResult = class StudentResult extends base_entity_1.BaseEntity {
    resultSheetId;
    studentId;
    schoolId;
    scores;
    totalScore;
    grade;
    position;
    classTeacherRemark;
    principalRemark;
    resultSheet;
    subjectScores;
};
exports.StudentResult = StudentResult;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentResult.prototype, "resultSheetId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentResult.prototype, "studentId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentResult.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [component_score_type_1.ComponentScore], { nullable: true }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], StudentResult.prototype, "scores", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], StudentResult.prototype, "totalScore", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentResult.prototype, "grade", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], StudentResult.prototype, "position", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentResult.prototype, "classTeacherRemark", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentResult.prototype, "principalRemark", void 0);
__decorate([
    (0, graphql_1.Field)(() => result_sheet_entity_1.ResultSheet),
    (0, typeorm_1.ManyToOne)(() => result_sheet_entity_1.ResultSheet, (rs) => rs.studentResults),
    (0, typeorm_1.JoinColumn)({ name: 'resultSheetId' }),
    __metadata("design:type", result_sheet_entity_1.ResultSheet)
], StudentResult.prototype, "resultSheet", void 0);
__decorate([
    (0, graphql_1.Field)(() => [subject_score_entity_1.SubjectScore], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => subject_score_entity_1.SubjectScore, (ss) => ss.studentResult, { eager: false }),
    __metadata("design:type", Array)
], StudentResult.prototype, "subjectScores", void 0);
exports.StudentResult = StudentResult = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('student_results')
], StudentResult);
//# sourceMappingURL=student-result.entity.js.map