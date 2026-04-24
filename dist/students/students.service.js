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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./entities/student.entity");
const student_parent_entity_1 = require("./entities/student-parent.entity");
const users_service_1 = require("../users/users.service");
const upload_service_1 = require("../upload/upload.service");
const enums_1 = require("../common/enums");
let StudentsService = class StudentsService {
    studentsRepository;
    studentParentsRepository;
    usersService;
    uploadService;
    dataSource;
    constructor(studentsRepository, studentParentsRepository, usersService, uploadService, dataSource) {
        this.studentsRepository = studentsRepository;
        this.studentParentsRepository = studentParentsRepository;
        this.usersService = usersService;
        this.uploadService = uploadService;
        this.dataSource = dataSource;
    }
    createStudent = (input, schoolId) => {
        const student = this.studentsRepository.create({
            firstName: input.firstName,
            lastName: input.lastName,
            admissionNumber: input.admissionNumber,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            currentClassId: input.classId,
            address: input.address,
            stateOfOrigin: input.stateOfOrigin,
            schoolId,
        });
        return this.studentsRepository.save(student);
    };
    updateStudent = (id, input, schoolId) => {
        return this.getStudentById(id, schoolId).then((student) => {
            const updateData = { ...input };
            if (input.classId) {
                updateData.currentClassId = input.classId;
                delete updateData.classId;
            }
            return this.studentsRepository
                .update(id, updateData)
                .then(() => this.getStudentById(id, schoolId));
        });
    };
    bulkImportStudents = (students, schoolId) => {
        const failed = [];
        const validStudents = [];
        students.forEach((input, index) => {
            if (!input.firstName || !input.lastName) {
                failed.push({
                    row: index + 1,
                    reason: 'firstName and lastName are required',
                });
                return;
            }
            if (!input.admissionNumber) {
                failed.push({ row: index + 1, reason: 'admissionNumber is required' });
                return;
            }
            if (!input.classId) {
                failed.push({ row: index + 1, reason: 'classId is required' });
                return;
            }
            if (!input.gender) {
                failed.push({ row: index + 1, reason: 'gender is required' });
                return;
            }
            validStudents.push({
                firstName: input.firstName,
                lastName: input.lastName,
                admissionNumber: input.admissionNumber,
                dateOfBirth: input.dateOfBirth || undefined,
                gender: input.gender,
                currentClassId: input.classId,
                address: input.address,
                stateOfOrigin: input.stateOfOrigin,
                schoolId,
            });
        });
        return this.dataSource
            .transaction((manager) => {
            const studentEntities = validStudents.map((s) => manager.create(student_entity_1.Student, s));
            return manager.save(student_entity_1.Student, studentEntities);
        })
            .then((savedStudents) => ({
            imported: savedStudents.length,
            failed,
            students: savedStudents,
        }));
    };
    linkParent = (studentId, parentUserId, schoolId) => {
        return this.getStudentById(studentId, schoolId).then((student) => this.usersService.findById(parentUserId).then((parentUser) => {
            if (!parentUser)
                throw new common_1.NotFoundException('Parent user not found');
            if (parentUser.role !== enums_1.UserRole.PARENT) {
                throw new common_1.BadRequestException('User does not have PARENT role');
            }
            const record = this.studentParentsRepository.create({
                studentId: student.id,
                parentId: parentUser.id,
            });
            return this.studentParentsRepository
                .save(record)
                .then(() => this.getStudentById(studentId, schoolId));
        }));
    };
    unlinkParent = (studentId, parentUserId, schoolId) => {
        return this.getStudentById(studentId, schoolId).then(() => this.studentParentsRepository
            .findOne({ where: { studentId, parentId: parentUserId } })
            .then((record) => {
            if (!record) {
                throw new common_1.NotFoundException('Parent link not found');
            }
            return this.studentParentsRepository.remove(record).then(() => true);
        }));
    };
    uploadPassportPhoto = (studentId, file, schoolId) => {
        return this.getStudentById(studentId, schoolId).then((student) => {
            const deleteOld = student.passportPhotoPublicId
                ? this.uploadService.deleteFile(student.passportPhotoPublicId)
                : Promise.resolve();
            return deleteOld
                .then(() => this.uploadService.uploadFile(file, 'student-passports'))
                .then((result) => this.studentsRepository
                .update(studentId, {
                passportPhotoUrl: result.url,
                passportPhotoPublicId: result.publicId,
            })
                .then(() => this.getStudentById(studentId, schoolId)));
        });
    };
    getStudentsByClass = (classId, schoolId) => {
        return this.studentsRepository.find({
            where: { currentClassId: classId, schoolId, isArchived: false },
            relations: ['currentClass'],
            order: { firstName: 'ASC' },
        });
    };
    getStudentById = (id, schoolId) => {
        return this.studentsRepository
            .findOne({
            where: { id, schoolId },
            relations: ['currentClass'],
        })
            .then((student) => {
            if (!student)
                throw new common_1.NotFoundException('Student not found');
            return student;
        });
    };
    getStudentsByParent = (parentUserId) => {
        return this.studentParentsRepository
            .find({
            where: { parentId: parentUserId },
            relations: ['student', 'student.currentClass'],
        })
            .then((records) => records.map((r) => r.student));
    };
    searchStudents = (query, schoolId) => {
        return this.studentsRepository.find({
            where: [
                { firstName: (0, typeorm_2.ILike)(`%${query}%`), schoolId, isArchived: false },
                { lastName: (0, typeorm_2.ILike)(`%${query}%`), schoolId, isArchived: false },
                { admissionNumber: (0, typeorm_2.ILike)(`%${query}%`), schoolId, isArchived: false },
            ],
            relations: ['currentClass'],
            order: { firstName: 'ASC' },
        });
    };
    promoteStudents = (input, schoolId) => {
        const { fromClassId, toClassId, studentIds, archiveGraduated } = input;
        return this.studentsRepository
            .find({
            where: studentIds.map((id) => ({
                id,
                currentClassId: fromClassId,
                schoolId,
                isArchived: false,
            })),
        })
            .then((students) => {
            if (archiveGraduated) {
                return this.studentsRepository
                    .update(students.map((s) => s.id), { isArchived: true })
                    .then(() => ({ promoted: 0, archived: students.length }));
            }
            return this.studentsRepository
                .update(students.map((s) => s.id), { currentClassId: toClassId })
                .then(() => ({ promoted: students.length, archived: 0 }));
        });
    };
    getArchivedStudents = (schoolId) => {
        return this.studentsRepository.find({
            where: { schoolId, isArchived: true },
            relations: ['currentClass'],
            order: { firstName: 'ASC' },
        });
    };
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(student_parent_entity_1.StudentParent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        upload_service_1.UploadService,
        typeorm_2.DataSource])
], StudentsService);
//# sourceMappingURL=students.service.js.map