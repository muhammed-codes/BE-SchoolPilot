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
exports.ClassSubject = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const class_entity_1 = require("./class.entity");
const subject_entity_1 = require("../../subjects/entities/subject.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let ClassSubject = class ClassSubject extends base_entity_1.BaseEntity {
    classId;
    subjectId;
    subjectTeacherId;
    classEntity;
    subject;
    subjectTeacher;
};
exports.ClassSubject = ClassSubject;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ClassSubject.prototype, "classId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ClassSubject.prototype, "subjectId", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ClassSubject.prototype, "subjectTeacherId", void 0);
__decorate([
    (0, graphql_1.Field)(() => class_entity_1.ClassEntity),
    (0, typeorm_1.ManyToOne)(() => class_entity_1.ClassEntity, (c) => c.classSubjects),
    (0, typeorm_1.JoinColumn)({ name: 'classId' }),
    __metadata("design:type", class_entity_1.ClassEntity)
], ClassSubject.prototype, "classEntity", void 0);
__decorate([
    (0, graphql_1.Field)(() => subject_entity_1.Subject),
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'subjectId' }),
    __metadata("design:type", subject_entity_1.Subject)
], ClassSubject.prototype, "subject", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'subjectTeacherId' }),
    __metadata("design:type", user_entity_1.User)
], ClassSubject.prototype, "subjectTeacher", void 0);
exports.ClassSubject = ClassSubject = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('class_subjects')
], ClassSubject);
//# sourceMappingURL=class-subject.entity.js.map