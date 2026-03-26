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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const student_attendance_entity_1 = require("./entities/student-attendance.entity");
const staff_attendance_entity_1 = require("./entities/staff-attendance.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const attendance_dto_1 = require("./dto/attendance.dto");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let AttendanceResolver = class AttendanceResolver {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    classAttendance(classId, date) {
        return this.attendanceService.getClassAttendance(classId, date);
    }
    studentAttendanceSummary(studentId, termId) {
        return this.attendanceService.getStudentAttendanceSummary(studentId, termId);
    }
    staffAttendanceLog(date, user) {
        return this.attendanceService.getStaffAttendanceLog(user.schoolId, date);
    }
    staffAttendanceHistory(userId, from, to, user) {
        return this.attendanceService.getStaffAttendanceHistory(userId, user.schoolId, from, to);
    }
    unmarkedClasses(date, user) {
        return this.attendanceService.getUnmarkedClasses(user.schoolId, date);
    }
    markStudentAttendance(input, user) {
        return this.attendanceService.markStudentAttendance(input, user.sub, user.schoolId);
    }
    clockAction(qrCode, user) {
        return this.attendanceService.clockAction(qrCode, user.sub);
    }
    manualStaffAttendance(input, user) {
        return this.attendanceService.manualStaffAttendance(input, user.sub);
    }
};
exports.AttendanceResolver = AttendanceResolver;
__decorate([
    (0, graphql_1.Query)(() => [student_attendance_entity_1.StudentAttendance]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL, enums_1.UserRole.CLASS_TEACHER),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, graphql_1.Args)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "classAttendance", null);
__decorate([
    (0, graphql_1.Query)(() => attendance_dto_1.AttendanceSummary),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PARENT, enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('termId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "studentAttendanceSummary", null);
__decorate([
    (0, graphql_1.Query)(() => [staff_attendance_entity_1.StaffAttendance]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('date')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "staffAttendanceLog", null);
__decorate([
    (0, graphql_1.Query)(() => [staff_attendance_entity_1.StaffAttendance]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, graphql_1.Args)('from')),
    __param(2, (0, graphql_1.Args)('to')),
    __param(3, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "staffAttendanceHistory", null);
__decorate([
    (0, graphql_1.Query)(() => [class_entity_1.ClassEntity]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('date')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "unmarkedClasses", null);
__decorate([
    (0, graphql_1.Mutation)(() => [student_attendance_entity_1.StudentAttendance]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.CLASS_TEACHER, enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.MarkAttendanceInput, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "markStudentAttendance", null);
__decorate([
    (0, graphql_1.Mutation)(() => staff_attendance_entity_1.StaffAttendance),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.CLASS_TEACHER, enums_1.UserRole.SUBJECT_TEACHER),
    __param(0, (0, graphql_1.Args)('qrCode')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "clockAction", null);
__decorate([
    (0, graphql_1.Mutation)(() => staff_attendance_entity_1.StaffAttendance),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.ManualStaffAttendanceInput, Object]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "manualStaffAttendance", null);
exports.AttendanceResolver = AttendanceResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceResolver);
//# sourceMappingURL=attendance.resolver.js.map