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
exports.StudentParent = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let StudentParent = class StudentParent extends base_entity_1.BaseEntity {
    studentId;
    parentId;
    student;
    parent;
};
exports.StudentParent = StudentParent;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentParent.prototype, "studentId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentParent.prototype, "parentId", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], StudentParent.prototype, "student", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", user_entity_1.User)
], StudentParent.prototype, "parent", void 0);
exports.StudentParent = StudentParent = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('student_parents'),
    (0, typeorm_1.Unique)(['studentId', 'parentId'])
], StudentParent);
//# sourceMappingURL=student-parent.entity.js.map