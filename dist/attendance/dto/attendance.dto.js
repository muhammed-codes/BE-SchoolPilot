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
exports.AttendanceSummary = exports.ManualStaffAttendanceInput = exports.MarkAttendanceInput = exports.StudentAttendanceRecordInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../common/enums");
let StudentAttendanceRecordInput = class StudentAttendanceRecordInput {
    studentId;
    status;
};
exports.StudentAttendanceRecordInput = StudentAttendanceRecordInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StudentAttendanceRecordInput.prototype, "studentId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.AttendanceStatus),
    (0, class_validator_1.IsEnum)(enums_1.AttendanceStatus),
    __metadata("design:type", String)
], StudentAttendanceRecordInput.prototype, "status", void 0);
exports.StudentAttendanceRecordInput = StudentAttendanceRecordInput = __decorate([
    (0, graphql_1.InputType)()
], StudentAttendanceRecordInput);
let MarkAttendanceInput = class MarkAttendanceInput {
    classId;
    date;
    records;
};
exports.MarkAttendanceInput = MarkAttendanceInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MarkAttendanceInput.prototype, "classId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MarkAttendanceInput.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)(() => [StudentAttendanceRecordInput]),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentAttendanceRecordInput),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], MarkAttendanceInput.prototype, "records", void 0);
exports.MarkAttendanceInput = MarkAttendanceInput = __decorate([
    (0, graphql_1.InputType)()
], MarkAttendanceInput);
let ManualStaffAttendanceInput = class ManualStaffAttendanceInput {
    userId;
    date;
    clockInTime;
    clockOutTime;
};
exports.ManualStaffAttendanceInput = ManualStaffAttendanceInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ManualStaffAttendanceInput.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualStaffAttendanceInput.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualStaffAttendanceInput.prototype, "clockInTime", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualStaffAttendanceInput.prototype, "clockOutTime", void 0);
exports.ManualStaffAttendanceInput = ManualStaffAttendanceInput = __decorate([
    (0, graphql_1.InputType)()
], ManualStaffAttendanceInput);
let AttendanceSummary = class AttendanceSummary {
    daysPresent;
    daysAbsent;
    daysLate;
    totalMarkedDays;
};
exports.AttendanceSummary = AttendanceSummary;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceSummary.prototype, "daysPresent", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceSummary.prototype, "daysAbsent", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceSummary.prototype, "daysLate", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceSummary.prototype, "totalMarkedDays", void 0);
exports.AttendanceSummary = AttendanceSummary = __decorate([
    (0, graphql_1.ObjectType)()
], AttendanceSummary);
//# sourceMappingURL=attendance.dto.js.map