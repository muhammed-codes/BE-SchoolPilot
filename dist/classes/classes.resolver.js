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
exports.ClassesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const classes_service_1 = require("./classes.service");
const class_entity_1 = require("./entities/class.entity");
const class_subject_entity_1 = require("./entities/class-subject.entity");
const create_class_input_1 = require("./dto/create-class.input");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
const pagination_1 = require("../common/pagination");
const PaginatedClass = (0, pagination_1.createPaginatedType)(class_entity_1.ClassEntity);
let ClassesResolver = class ClassesResolver {
    classesService;
    constructor(classesService) {
        this.classesService = classesService;
    }
    createClass(input, user) {
        return this.classesService.createClass(input, user.schoolId);
    }
    schoolClasses(pagination, user) {
        return this.classesService.getClassesBySchool(user.schoolId, pagination);
    }
    myClasses(user) {
        return this.classesService.getClassesForTeacher(user.sub, user.schoolId);
    }
    classById(id, user) {
        return this.classesService.getClassById(id, user.schoolId);
    }
    assignClassTeacher(classId, teacherId, user) {
        return this.classesService.assignClassTeacher(classId, teacherId, user.schoolId);
    }
    assignSubjectsToClass(classId, subjectIds, user) {
        return this.classesService.assignSubjectsToClass(classId, subjectIds, user.schoolId);
    }
    assignSubjectTeacher(classId, subjectId, teacherId, user) {
        return this.classesService.assignSubjectTeacher(classId, subjectId, teacherId, user.schoolId);
    }
};
exports.ClassesResolver = ClassesResolver;
__decorate([
    (0, graphql_1.Mutation)(() => class_entity_1.ClassEntity),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_class_input_1.CreateClassInput, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "createClass", null);
__decorate([
    (0, graphql_1.Query)(() => PaginatedClass),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN, enums_1.UserRole.PRINCIPAL),
    __param(0, (0, graphql_1.Args)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationArgs, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "schoolClasses", null);
__decorate([
    (0, graphql_1.Query)(() => [class_entity_1.ClassEntity]),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.CLASS_TEACHER, enums_1.UserRole.SUBJECT_TEACHER),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "myClasses", null);
__decorate([
    (0, graphql_1.Query)(() => class_entity_1.ClassEntity),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "classById", null);
__decorate([
    (0, graphql_1.Mutation)(() => class_entity_1.ClassEntity),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, graphql_1.Args)('teacherId')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "assignClassTeacher", null);
__decorate([
    (0, graphql_1.Mutation)(() => class_entity_1.ClassEntity),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, graphql_1.Args)('subjectIds', { type: () => [String] })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "assignSubjectsToClass", null);
__decorate([
    (0, graphql_1.Mutation)(() => class_subject_entity_1.ClassSubject),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SCHOOL_ADMIN),
    __param(0, (0, graphql_1.Args)('classId')),
    __param(1, (0, graphql_1.Args)('subjectId')),
    __param(2, (0, graphql_1.Args)('teacherId')),
    __param(3, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ClassesResolver.prototype, "assignSubjectTeacher", null);
exports.ClassesResolver = ClassesResolver = __decorate([
    (0, graphql_1.Resolver)(() => class_entity_1.ClassEntity),
    __metadata("design:paramtypes", [classes_service_1.ClassesService])
], ClassesResolver);
//# sourceMappingURL=classes.resolver.js.map