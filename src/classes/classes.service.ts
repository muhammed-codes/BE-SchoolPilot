import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { PaginationArgs } from '../common/pagination';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classesRepository: Repository<ClassEntity>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectsRepository: Repository<ClassSubject>,
  ) {}

  createClass = (input: CreateClassInput, schoolId: string) => {
    const classEntity = this.classesRepository.create({
      name: input.name,
      schoolId,
    });
    return this.classesRepository.save(classEntity);
  };

  assignClassTeacher = (
    classId: string,
    teacherId: string,
    schoolId: string,
  ) => {
    return this.classesRepository
      .update({ id: classId, schoolId }, { classTeacherId: teacherId })
      .then(() => this.getClassById(classId, schoolId));
  };

  assignSubjectsToClass = (
    classId: string,
    subjectIds: string[],
    schoolId: string,
  ) => {
    return this.getClassById(classId, schoolId)
      .then(() => this.classSubjectsRepository.find({ where: { classId } }))
      .then((existingAssignments) => {
        const existingSubjectIds = existingAssignments.map((cs) => cs.subjectId);
        const toRemove = existingAssignments.filter(
          (cs) => !subjectIds.includes(cs.subjectId),
        );
        const toAddIds = subjectIds.filter(
          (id) => !existingSubjectIds.includes(id),
        );

        return this.classSubjectsRepository.manager.transaction((manager) => {
          const transactionalRepo = manager.withRepository(
            this.classSubjectsRepository,
          );
          const removalPromise =
            toRemove.length > 0
              ? transactionalRepo.remove(toRemove)
              : Promise.resolve();

          return removalPromise.then(() => {
            if (toAddIds.length > 0) {
              const newSubjects = toAddIds.map((subjectId) =>
                transactionalRepo.create({ classId, subjectId }),
              );
              return transactionalRepo.save(newSubjects);
            }
            return Promise.resolve();
          });
        });
      })
      .then(() => this.getClassById(classId, schoolId));
  };

  assignSubjectTeacher = (
    classId: string,
    subjectId: string,
    teacherId: string,
    schoolId: string,
  ) => {
    return this.getClassById(classId, schoolId).then(() =>
      this.classSubjectsRepository
        .findOne({ where: { classId, subjectId } })
        .then((cs) => {
          if (!cs) {
            throw new NotFoundException(
              'Subject is not assigned to this class',
            );
          }
          return this.classSubjectsRepository
            .update(cs.id, { subjectTeacherId: teacherId })
            .then(() =>
              this.classSubjectsRepository.findOne({
                where: { id: cs.id },
                relations: ['subject', 'subjectTeacher'],
              }),
            );
        }),
    );
  };

  removeSubjectFromClass = (
    classId: string,
    subjectId: string,
    schoolId: string,
  ) => {
    return this.getClassById(classId, schoolId).then(() =>
      this.classSubjectsRepository
        .findOne({ where: { classId, subjectId } })
        .then((cs) => {
          if (!cs)
            throw new NotFoundException('Class-subject assignment not found');
          return this.classSubjectsRepository.remove(cs).then(() => true);
        }),
    );
  };

  getClassesBySchool = (schoolId: string, pagination?: PaginationArgs) => {
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

  getClassById = (id: string, schoolId: string) => {
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
        if (!classEntity) throw new NotFoundException('Class not found');
        return classEntity;
      });
  };

  getClassesForTeacher = (teacherId: string, schoolId: string) => {
    return this.classesRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.classTeacher', 'classTeacher')
      .leftJoin('class_subjects', 'cs', 'cs."classId" = class.id')
      .where('class."schoolId" = :schoolId', { schoolId })
      .andWhere(
        '(class."classTeacherId" = :teacherId OR cs."subjectTeacherId" = :teacherId)',
        { teacherId },
      )
      .groupBy('class.id')
      .addGroupBy('classTeacher.id')
      .getMany();
  };
}
