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
exports.SubjectScore = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const student_result_entity_1 = require("./student-result.entity");
const component_score_type_1 = require("../dto/component-score.type");
let SubjectScore = class SubjectScore extends base_entity_1.BaseEntity {
    studentResultId;
    subjectId;
    resultSheetId;
    scores;
    totalScore;
    grade;
    teacherRemark;
    isSubmitted;
    submittedAt;
    enteredByUserId;
    studentResult;
};
exports.SubjectScore = SubjectScore;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SubjectScore.prototype, "studentResultId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SubjectScore.prototype, "subjectId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SubjectScore.prototype, "resultSheetId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [component_score_type_1.ComponentScore], { nullable: true }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SubjectScore.prototype, "scores", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SubjectScore.prototype, "totalScore", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubjectScore.prototype, "grade", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubjectScore.prototype, "teacherRemark", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SubjectScore.prototype, "isSubmitted", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SubjectScore.prototype, "submittedAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SubjectScore.prototype, "enteredByUserId", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_result_entity_1.StudentResult),
    (0, typeorm_1.ManyToOne)(() => student_result_entity_1.StudentResult, (sr) => sr.subjectScores),
    (0, typeorm_1.JoinColumn)({ name: 'studentResultId' }),
    __metadata("design:type", student_result_entity_1.StudentResult)
], SubjectScore.prototype, "studentResult", void 0);
exports.SubjectScore = SubjectScore = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('subject_scores')
], SubjectScore);
//# sourceMappingURL=subject-score.entity.js.map