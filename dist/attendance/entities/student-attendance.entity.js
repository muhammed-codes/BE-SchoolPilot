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
exports.StudentAttendance = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const enums_1 = require("../../common/enums");
const student_entity_1 = require("../../students/entities/student.entity");
const class_entity_1 = require("../../classes/entities/class.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const term_entity_1 = require("../../terms/entities/term.entity");
let StudentAttendance = class StudentAttendance extends base_entity_1.BaseEntity {
    studentId;
    classId;
    schoolId;
    termId;
    date;
    status;
    markedByUserId;
    markedAt;
    student;
    classEntity;
    markedByUser;
    term;
};
exports.StudentAttendance = StudentAttendance;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "studentId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "classId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "termId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.AttendanceStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.AttendanceStatus }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "markedByUserId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], StudentAttendance.prototype, "markedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], StudentAttendance.prototype, "student", void 0);
__decorate([
    (0, graphql_1.Field)(() => class_entity_1.ClassEntity),
    (0, typeorm_1.ManyToOne)(() => class_entity_1.ClassEntity, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'classId' }),
    __metadata("design:type", class_entity_1.ClassEntity)
], StudentAttendance.prototype, "classEntity", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'markedByUserId' }),
    __metadata("design:type", user_entity_1.User)
], StudentAttendance.prototype, "markedByUser", void 0);
__decorate([
    (0, graphql_1.Field)(() => term_entity_1.Term),
    (0, typeorm_1.ManyToOne)(() => term_entity_1.Term, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'termId' }),
    __metadata("design:type", term_entity_1.Term)
], StudentAttendance.prototype, "term", void 0);
exports.StudentAttendance = StudentAttendance = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('student_attendance'),
    (0, typeorm_1.Unique)(['studentId', 'date'])
], StudentAttendance);
//# sourceMappingURL=student-attendance.entity.js.map