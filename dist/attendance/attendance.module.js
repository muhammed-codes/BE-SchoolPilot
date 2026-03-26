"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_attendance_entity_1 = require("./entities/student-attendance.entity");
const staff_attendance_entity_1 = require("./entities/staff-attendance.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const school_entity_1 = require("../schools/entities/school.entity");
const user_entity_1 = require("../users/entities/user.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const attendance_service_1 = require("./attendance.service");
const attendance_resolver_1 = require("./attendance.resolver");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_attendance_entity_1.StudentAttendance,
                staff_attendance_entity_1.StaffAttendance,
                class_entity_1.ClassEntity,
                school_entity_1.School,
                user_entity_1.User,
                term_entity_1.Term,
            ]),
        ],
        providers: [attendance_service_1.AttendanceService, attendance_resolver_1.AttendanceResolver],
        exports: [attendance_service_1.AttendanceService],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map