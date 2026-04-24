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
exports.StudentsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const graphql_upload_ts_1 = require("graphql-upload-ts");
const students_service_1 = require("./students.service");
const student_entity_1 = require("./entities/student.entity");
const create_student_input_1 = require("./dto/create-student.input");
const update_student_input_1 = require("./dto/update-student.input");
const promote_students_input_1 = require("./dto/promote-students.input");
const bulk_import_result_type_1 = require("./dto/bulk-import-result.type");
const promotion_result_type_1 = require("./dto/promotion-result.type");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let StudentsResolver = class StudentsResolver {
    studentsService;
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    studentsByClass(classId, user) {
        return this.studentsService.getStudentsByClass(classId, user.schoolId);
    }
    student(id, user) {
        return this.studentsService.getStudentById(id, user.schoolId);
    }
    myChildren(user) {
        return this.studentsService.getStudentsByParent(user.sub);
    }
    searchStudents(query, user) {
        return this.studentsService.searchStudents(query, user.schoolId);
    }
    createStudent(input, user) {
        return this.studentsService.createStudent(input, user.schoolId);
    }
    updateStudent(id, input, user) {
        return this.studentsService.updateStudent(id, input, user.schoolId);
    }
    bulkImportStudents(students, user) {
        return this.studentsService.bulkImportStudents(students, user.schoolId);
    }
    linkParent(studentId, parentUserId, user) {
        return this.studentsService.linkParent(studentId, parentUserId, user.schoolId);
    }
    unlinkParent(studentId, parentUserId, user) {
        return this.studentsService.unlinkParent(studentId, parentUserId, user.schoolId);
    }
    uploadPassportPhoto(studentId, file, user) {
        return this.studentsService.uploadPassportPhoto(studentId, file, user.schoolId);
    }
    promoteStudents(input, user) {
        return this.studentsService.promoteStudents(input, user.schoolId);
    }
};
exports.StudentsResolver = StudentsResolver;
__decorate([
    (0, graphql_1.Query)(() => [student_entity_1.Student]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.CLASS_TEACHER, enums_1.UserRole.SUBJECT_TEACHER, enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "studentsByClass", null);
__decorate([
    (0, graphql_1.Query)(() => student_entity_1.Student, { nullable: true }),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "student", null);
__decorate([
    (0, graphql_1.Query)(() => [student_entity_1.Student]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.PARENT),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "myChildren", null);
__decorate([
    (0, graphql_1.Query)(() => [student_entity_1.Student]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('query')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "searchStudents", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_student_input_1.CreateStudentInput, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "createStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_student_input_1.UpdateStudentInput, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "updateStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => bulk_import_result_type_1.BulkImportResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('students', { type: () => [create_student_input_1.CreateStudentInput] })),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "bulkImportStudents", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('parentUserId')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "linkParent", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('parentUserId')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "unlinkParent", null);
__decorate([
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('file', { type: () => graphql_upload_ts_1.GraphQLUpload })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, graphql_upload_ts_1.Upload, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "uploadPassportPhoto", null);
__decorate([
    (0, graphql_1.Mutation)(() => promotion_result_type_1.PromotionResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promote_students_input_1.PromoteStudentsInput, Object]),
    __metadata("design:returntype", void 0)
], StudentsResolver.prototype, "promoteStudents", null);
exports.StudentsResolver = StudentsResolver = __decorate([
    (0, graphql_1.Resolver)(() => student_entity_1.Student),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsResolver);
//# sourceMappingURL=students.resolver.js.map