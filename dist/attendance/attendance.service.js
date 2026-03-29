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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_attendance_entity_1 = require("./entities/student-attendance.entity");
const staff_attendance_entity_1 = require("./entities/staff-attendance.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const school_entity_1 = require("../schools/entities/school.entity");
const user_entity_1 = require("../users/entities/user.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const enums_1 = require("../common/enums");
let AttendanceService = class AttendanceService {
    studentAttendanceRepo;
    staffAttendanceRepo;
    classRepo;
    schoolRepo;
    userRepo;
    termRepo;
    constructor(studentAttendanceRepo, staffAttendanceRepo, classRepo, schoolRepo, userRepo, termRepo) {
        this.studentAttendanceRepo = studentAttendanceRepo;
        this.staffAttendanceRepo = staffAttendanceRepo;
        this.classRepo = classRepo;
        this.schoolRepo = schoolRepo;
        this.userRepo = userRepo;
        this.termRepo = termRepo;
    }
    markStudentAttendance = (input, markerId, schoolId) => {
        return Promise.all([
            this.classRepo.findOne({ where: { id: input.classId, schoolId } }),
            this.userRepo.findOne({ where: { id: markerId } }),
            this.termRepo.findOne({
                where: { schoolId },
                order: { createdAt: 'DESC' },
            }),
        ]).then(([classEntity, marker, term]) => {
            if (!classEntity)
                throw new common_1.NotFoundException('Class not found');
            if (!marker)
                throw new common_1.NotFoundException('User not found');
            if (!term)
                throw new common_1.NotFoundException('No active term found');
            if (marker.role !== enums_1.UserRole.SCHOOL_ADMIN &&
                classEntity.classTeacherId !== markerId) {
                throw new common_1.ForbiddenException('Only the class teacher or school admin can mark attendance');
            }
            return Promise.all(input.records.map((record) => this.studentAttendanceRepo
                .findOne({
                where: {
                    studentId: record.studentId,
                    date: input.date,
                },
            })
                .then((existing) => {
                if (existing) {
                    existing.status = record.status;
                    existing.markedByUserId = markerId;
                    existing.markedAt = new Date();
                    return this.studentAttendanceRepo.save(existing);
                }
                else {
                    const newRecord = this.studentAttendanceRepo.create({
                        studentId: record.studentId,
                        classId: input.classId,
                        schoolId,
                        termId: term.id,
                        date: input.date,
                        status: record.status,
                        markedByUserId: markerId,
                        markedAt: new Date(),
                    });
                    return this.studentAttendanceRepo.save(newRecord);
                }
            }))).then(() => this.getClassAttendance(input.classId, input.date));
        });
    };
    getStudentAttendance = (studentId, termId) => {
        return this.studentAttendanceRepo.find({
            where: { studentId, termId },
            order: { date: 'ASC' },
        });
    };
    getClassAttendance = (classId, date) => {
        return this.studentAttendanceRepo.find({
            where: { classId, date },
            relations: ['student'],
            order: { student: { firstName: 'ASC' } },
        });
    };
    getStudentAttendanceSummary = (studentId, termId) => {
        return this.studentAttendanceRepo
            .find({ where: { studentId, termId } })
            .then((records) => {
            let daysPresent = 0;
            let daysAbsent = 0;
            let daysLate = 0;
            records.forEach((record) => {
                if (record.status === enums_1.AttendanceStatus.PRESENT)
                    daysPresent++;
                if (record.status === enums_1.AttendanceStatus.ABSENT)
                    daysAbsent++;
                if (record.status === enums_1.AttendanceStatus.LATE)
                    daysLate++;
            });
            return {
                daysPresent,
                daysAbsent,
                daysLate,
                totalMarkedDays: records.length,
            };
        });
    };
    clockAction = (qrCode, userId) => {
        return this.schoolRepo
            .findOne({ where: { uniqueQrCode: qrCode } })
            .then((school) => {
            if (!school)
                throw new common_1.NotFoundException('Invalid QR code');
            return this.userRepo
                .findOne({ where: { id: userId, schoolId: school.id } })
                .then((user) => {
                if (!user)
                    throw new common_1.ForbiddenException('User does not belong to this school');
                const today = new Date().toISOString().split('T')[0];
                const now = new Date();
                return this.staffAttendanceRepo
                    .findOne({ where: { userId, date: today } })
                    .then((record) => {
                    if (!record || !record.clockInTime) {
                        let isLate = false;
                        if (school.schoolStartTime) {
                            const [hours, minutes] = school.schoolStartTime
                                .split(':')
                                .map(Number);
                            const startDateTime = new Date();
                            startDateTime.setHours(hours, minutes, 0, 0);
                            if (now > startDateTime) {
                                isLate = true;
                            }
                        }
                        if (record) {
                            record.clockInTime = now;
                            record.isLate = isLate;
                            return this.staffAttendanceRepo.save(record);
                        }
                        else {
                            const newRecord = this.staffAttendanceRepo.create({
                                userId,
                                schoolId: school.id,
                                date: today,
                                clockInTime: now,
                                isLate,
                                isManual: false,
                            });
                            return this.staffAttendanceRepo.save(newRecord);
                        }
                    }
                    else if (!record.clockOutTime) {
                        record.clockOutTime = now;
                        return this.staffAttendanceRepo.save(record);
                    }
                    else {
                        throw new common_1.BadRequestException('Already clocked out today');
                    }
                });
            });
        });
    };
    manualStaffAttendance = (input, adminId, schoolId) => {
        return this.userRepo
            .findOne({ where: { id: input.userId } })
            .then((user) => {
            if (!user || user.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('User not found in this school');
            }
            return this.staffAttendanceRepo
                .findOne({ where: { userId: input.userId, date: input.date } })
                .then((existing) => {
                if (existing) {
                    if (input.clockInTime)
                        existing.clockInTime = new Date(input.clockInTime);
                    if (input.clockOutTime)
                        existing.clockOutTime = new Date(input.clockOutTime);
                    existing.isManual = true;
                    return this.staffAttendanceRepo.save(existing);
                }
                else {
                    const newRecord = this.staffAttendanceRepo.create({
                        userId: input.userId,
                        schoolId: user.schoolId,
                        date: input.date,
                        clockInTime: input.clockInTime
                            ? new Date(input.clockInTime)
                            : undefined,
                        clockOutTime: input.clockOutTime
                            ? new Date(input.clockOutTime)
                            : undefined,
                        isManual: true,
                        isLate: false,
                    });
                    return this.staffAttendanceRepo.save(newRecord);
                }
            });
        });
    };
    getStaffAttendanceLog = (schoolId, date) => {
        return this.staffAttendanceRepo.find({
            where: { schoolId, date },
            relations: ['user'],
            order: { clockInTime: 'ASC' },
        });
    };
    getStaffAttendanceHistory = (userId, schoolId, from, to) => {
        return this.staffAttendanceRepo.find({
            where: {
                userId,
                schoolId,
                date: (0, typeorm_2.Between)(from, to),
            },
            order: { date: 'DESC' },
        });
    };
    getUnmarkedClasses = (schoolId, date) => {
        return this.classRepo
            .find({ where: { schoolId }, relations: ['classTeacher'] })
            .then((classes) => {
            return this.studentAttendanceRepo
                .find({
                where: { schoolId, date },
                select: ['classId'],
            })
                .then((records) => {
                const markedClassIds = new Set(records.map((r) => r.classId));
                return classes.filter((c) => !markedClassIds.has(c.id));
            });
        });
    };
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendance)),
    __param(1, (0, typeorm_1.InjectRepository)(staff_attendance_entity_1.StaffAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(class_entity_1.ClassEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(term_entity_1.Term)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map