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
exports.Student = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const enums_1 = require("../../common/enums");
const class_entity_1 = require("../../classes/entities/class.entity");
let Student = class Student extends base_entity_1.BaseEntity {
    firstName;
    lastName;
    admissionNumber;
    dateOfBirth;
    gender;
    passportPhotoUrl;
    passportPhotoPublicId;
    address;
    stateOfOrigin;
    schoolId;
    isArchived;
    currentClassId;
    currentClass;
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
};
exports.Student = Student;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "firstName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "lastName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "admissionNumber", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Student.prototype, "dateOfBirth", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.Gender),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.Gender }),
    __metadata("design:type", String)
], Student.prototype, "gender", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "passportPhotoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "passportPhotoPublicId", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "address", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Student.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "isArchived", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "currentClassId", void 0);
__decorate([
    (0, graphql_1.Field)(() => class_entity_1.ClassEntity, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => class_entity_1.ClassEntity, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'currentClassId' }),
    __metadata("design:type", class_entity_1.ClassEntity)
], Student.prototype, "currentClass", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Student.prototype, "fullName", null);
exports.Student = Student = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('students'),
    (0, typeorm_1.Unique)(['admissionNumber', 'schoolId'])
], Student);
//# sourceMappingURL=student.entity.js.map