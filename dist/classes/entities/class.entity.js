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
exports.ClassEntity = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const class_subject_entity_1 = require("./class-subject.entity");
let ClassEntity = class ClassEntity extends base_entity_1.BaseEntity {
    name;
    schoolId;
    classTeacherId;
    classTeacher;
    classSubjects;
};
exports.ClassEntity = ClassEntity;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClassEntity.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ClassEntity.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ClassEntity.prototype, "classTeacherId", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'classTeacherId' }),
    __metadata("design:type", user_entity_1.User)
], ClassEntity.prototype, "classTeacher", void 0);
__decorate([
    (0, graphql_1.Field)(() => [class_subject_entity_1.ClassSubject], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => class_subject_entity_1.ClassSubject, (cs) => cs.classEntity, { eager: false }),
    __metadata("design:type", Array)
], ClassEntity.prototype, "classSubjects", void 0);
exports.ClassEntity = ClassEntity = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('classes')
], ClassEntity);
//# sourceMappingURL=class.entity.js.map