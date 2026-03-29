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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("./entities/class.entity");
const class_subject_entity_1 = require("./entities/class-subject.entity");
let ClassesService = class ClassesService {
    classesRepository;
    classSubjectsRepository;
    constructor(classesRepository, classSubjectsRepository) {
        this.classesRepository = classesRepository;
        this.classSubjectsRepository = classSubjectsRepository;
    }
    createClass = (input, schoolId) => {
        const classEntity = this.classesRepository.create({
            name: input.name,
            schoolId,
        });
        return this.classesRepository.save(classEntity);
    };
    assignClassTeacher = (classId, teacherId, schoolId) => {
        return this.classesRepository
            .update({ id: classId, schoolId }, { classTeacherId: teacherId })
            .then(() => this.getClassById(classId, schoolId));
    };
    assignSubjectsToClass = async (classId, subjectIds, schoolId) => {
        await this.getClassById(classId, schoolId);
        const existingAssignments = await this.classSubjectsRepository.find({
            where: { classId },
        });
        const existingSubjectIds = existingAssignments.map((cs) => cs.subjectId);
        const toRemove = existingAssignments.filter((cs) => !subjectIds.includes(cs.subjectId));
        const toAddIds = subjectIds.filter((id) => !existingSubjectIds.includes(id));
        if (toRemove.length > 0) {
            await this.classSubjectsRepository.remove(toRemove);
        }
        if (toAddIds.length > 0) {
            const newSubjects = toAddIds.map((subjectId) => this.classSubjectsRepository.create({
                classId,
                subjectId,
            }));
            await this.classSubjectsRepository.save(newSubjects);
        }
        return this.getClassById(classId, schoolId);
    };
    assignSubjectTeacher = (classId, subjectId, teacherId, schoolId) => {
        return this.getClassById(classId, schoolId).then(() => this.classSubjectsRepository
            .findOne({ where: { classId, subjectId } })
            .then((cs) => {
            if (!cs) {
                throw new common_1.NotFoundException('Subject is not assigned to this class');
            }
            return this.classSubjectsRepository
                .update(cs.id, { subjectTeacherId: teacherId })
                .then(() => this.classSubjectsRepository.findOne({
                where: { id: cs.id },
                relations: ['subject', 'subjectTeacher'],
            }));
        }));
    };
    removeSubjectFromClass = (classId, subjectId, schoolId) => {
        return this.getClassById(classId, schoolId).then(() => this.classSubjectsRepository
            .findOne({ where: { classId, subjectId } })
            .then((cs) => {
            if (!cs)
                throw new common_1.NotFoundException('Class-subject assignment not found');
            return this.classSubjectsRepository.remove(cs).then(() => true);
        }));
    };
    getClassesBySchool = (schoolId, pagination) => {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const skip = (page - 1) * limit;
        return this.classesRepository
            .findAndCount({
            where: { schoolId },
            relations: ['classTeacher', 'classSubjects', 'classSubjects.subject'],
            skip,
            take: limit,
            order: { name: 'ASC' },
        })
            .then(([items, total]) => ({
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }));
    };
    getClassById = (id, schoolId) => {
        return this.classesRepository
            .findOne({
            where: { id, schoolId },
            relations: [
                'classTeacher',
                'classSubjects',
                'classSubjects.subject',
                'classSubjects.subjectTeacher',
            ],
        })
            .then((classEntity) => {
            if (!classEntity)
                throw new common_1.NotFoundException('Class not found');
            return classEntity;
        });
    };
    getClassesForTeacher = (teacherId, schoolId) => {
        return this.classesRepository
            .createQueryBuilder('class')
            .leftJoinAndSelect('class.classTeacher', 'classTeacher')
            .leftJoin('class_subjects', 'cs', 'cs."classId" = class.id')
            .where('class."schoolId" = :schoolId', { schoolId })
            .andWhere('(class."classTeacherId" = :teacherId OR cs."subjectTeacherId" = :teacherId)', { teacherId })
            .groupBy('class.id')
            .addGroupBy('classTeacher.id')
            .getMany();
    };
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.ClassEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(class_subject_entity_1.ClassSubject)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ClassesService);
//# sourceMappingURL=classes.service.js.map