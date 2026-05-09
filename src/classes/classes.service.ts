import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { PaginationArgs } from '../common/pagination';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classesRepository: Repository<ClassEntity>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectsRepository: Repository<ClassSubject>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
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
        const existingSubjectIds = existingAssignments.map(
          (cs) => cs.subjectId,
        );
        const toRemove = existingAssignments.filter(
          (cs) => !subjectIds.includes(cs.subjectId),
        );
        const toAddIds = subjectIds.filter(
          (id) => !existingSubjectIds.includes(id),
        );

        return this.classSubjectsRepository.manager.transaction(
          async (manager) => {
            const transactionalRepo = manager.withRepository(
              this.classSubjectsRepository,
            );

            if (toRemove.length > 0) {
              await transactionalRepo.remove(toRemove);
            }

            if (toAddIds.length > 0) {
              const newSubjects = toAddIds.map((subjectId) =>
                transactionalRepo.create({ classId, subjectId }),
              );
              return transactionalRepo.save(newSubjects);
            }
            return Promise.resolve();
          },
        );
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

  private enrichWithStudentCounts = (
    classes: ClassEntity[],
    schoolId: string,
  ): Promise<ClassEntity[]> => {
    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) return Promise.resolve(classes);

    return this.studentsRepository
      .createQueryBuilder('student')
      .select('student.currentClassId', 'classId')
      .addSelect('COUNT(student.id)', 'totalNoOfStudents')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false })
      .andWhere('student.currentClassId IN (:...classIds)', { classIds })
      .groupBy('student.currentClassId')
      .getRawMany()
      .then((rawCounts) => {
        const countsMap = new Map(
          rawCounts.map((row) => [row.classId, Number(row.totalNoOfStudents)]),
        );
        classes.forEach((c) => {
          c.totalNoOfStudents = countsMap.get(c.id) || 0;
        });
        return classes;
      });
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
      .then(([items, total]) =>
        this.enrichWithStudentCounts(items, schoolId).then((enriched) => ({
          items: enriched,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        })),
      );
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

  getClassesForTeacher = (teacherId: string, schoolId: string) =>
    this.classesRepository
      .createQueryBuilder('class')
      .select('class.id')
      .leftJoin('class_subjects', 'cs', 'cs."classId" = class.id')
      .where('class."schoolId" = :schoolId', { schoolId })
      .andWhere(
        '(class."classTeacherId" = :teacherId OR cs."subjectTeacherId" = :teacherId)',
        { teacherId },
      )
      .groupBy('class.id')
      .getMany()
      .then((partial) => {
        const ids = partial.map((c) => c.id);
        if (ids.length === 0) return [];
        return this.classesRepository.find({
          where: { id: In(ids) },
          relations: [
            'classTeacher',
            'classSubjects',
            'classSubjects.subject',
            'classSubjects.subjectTeacher',
          ],
          order: { name: 'ASC' },
        });
      });

  getClassesForTeacherPaginated = (
    teacherId: string,
    schoolId: string,
    pagination?: PaginationArgs,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    return this.getClassesForTeacher(teacherId, schoolId).then((all) =>
      this.enrichWithStudentCounts(all, schoolId).then((enriched) => ({
        items: enriched.slice(skip, skip + limit),
        total: enriched.length,
        page,
        totalPages: Math.ceil(enriched.length / limit),
      })),
    );
  };

  getTeacherClassIds = (teacherId: string, schoolId: string): Promise<string[]> =>
    this.getClassesForTeacher(teacherId, schoolId).then((classes) =>
      classes.map((c) => c.id),
    );
}
