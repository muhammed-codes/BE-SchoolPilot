import { UserRole } from '../common/enums/role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { PaginationArgs } from '../common/pagination';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classesRepository: Repository<ClassEntity>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectsRepository: Repository<ClassSubject>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  createClass = (input: CreateClassInput, schoolId: string) => {
    const teacherIds =
      input.classTeacherIds && input.classTeacherIds.length > 0
        ? Array.from(new Set(input.classTeacherIds.filter(Boolean)))
        : input.classTeacherId
          ? [input.classTeacherId]
          : [];
    const primaryTeacherId = teacherIds[0] || input.classTeacherId || null;

    const classEntity = this.classesRepository.create({
      name: input.name,
      classTeacherId: primaryTeacherId as unknown as string,
      classTeacherIds: teacherIds,
      schoolId,
    });
    return this.classesRepository.save(classEntity);
  };

  assignClassTeacher = (
    classId: string,
    teacherId: string,
    schoolId: string,
  ) => {
    const teacherIds = teacherId ? [teacherId] : [];
    return this.classesRepository
      .update(
        { id: classId, schoolId },
        {
          classTeacherId: teacherId || (null as unknown as string),
          classTeacherIds: teacherIds,
        },
      )
      .then(() => this.getClassById(classId, schoolId));
  };

  assignClassTeachers = (
    classId: string,
    teacherIds: string[],
    schoolId: string,
  ) => {
    const cleanTeacherIds = Array.from(
      new Set((teacherIds || []).filter(Boolean)),
    );
    const primaryTeacherId = cleanTeacherIds[0] || null;
    return this.classesRepository
      .update(
        { id: classId, schoolId },
        {
          classTeacherId: primaryTeacherId as unknown as string,
          classTeacherIds: cleanTeacherIds,
        },
      )
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
                transactionalRepo.create({ classId, subjectId, schoolId }),
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
          const teacherIds = teacherId ? [teacherId] : [];
          return this.classSubjectsRepository
            .update(cs.id, {
              subjectTeacherId: teacherId || (null as unknown as string),
              teacherIds,
            })
            .then(() =>
              this.classSubjectsRepository.findOne({
                where: { id: cs.id },
                relations: ['subject', 'subjectTeacher'],
              }),
            )
            .then(async (updatedCs) => {
              if (updatedCs) {
                await this.enrichClassSubjectsWithTeachers([updatedCs]);
              }
              return updatedCs!;
            });
        }),
    );
  };

  assignSubjectTeachers = (
    classId: string,
    subjectId: string,
    teacherIds: string[],
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
          const cleanTeacherIds = Array.from(
            new Set((teacherIds || []).filter(Boolean)),
          );
          const primaryTeacherId = cleanTeacherIds[0] || null;
          return this.classSubjectsRepository
            .update(cs.id, {
              subjectTeacherId: primaryTeacherId as unknown as string,
              teacherIds: cleanTeacherIds,
            })
            .then(() =>
              this.classSubjectsRepository.findOne({
                where: { id: cs.id },
                relations: ['subject', 'subjectTeacher'],
              }),
            )
            .then(async (updatedCs) => {
              if (updatedCs) {
                await this.enrichClassSubjectsWithTeachers([updatedCs]);
              }
              return updatedCs!;
            });
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

  enrichClassSubjectsWithTeachers = async (
    classSubjects: ClassSubject[],
  ): Promise<ClassSubject[]> => {
    if (!classSubjects.length) return classSubjects;
    const allTeacherIds = new Set<string>();
    classSubjects.forEach((cs) => {
      (cs.teacherIds || []).forEach((id) => allTeacherIds.add(id));
      if (cs.subjectTeacherId) allTeacherIds.add(cs.subjectTeacherId);
    });
    if (allTeacherIds.size === 0) {
      classSubjects.forEach((cs) => {
        cs.teachers = cs.subjectTeacher ? [cs.subjectTeacher] : [];
      });
      return classSubjects;
    }
    const teachers = await this.usersRepository.findBy({
      id: In(Array.from(allTeacherIds)),
    });
    const teacherMap = new Map<string, User>(teachers.map((t) => [t.id, t]));
    classSubjects.forEach((cs) => {
      const ids =
        cs.teacherIds && cs.teacherIds.length > 0
          ? cs.teacherIds
          : cs.subjectTeacherId
            ? [cs.subjectTeacherId]
            : [];
      cs.teachers = ids
        .map((id) => teacherMap.get(id))
        .filter(Boolean) as User[];
      if (!cs.subjectTeacher && cs.teachers.length > 0) {
        cs.subjectTeacher = cs.teachers[0];
      }
    });
    return classSubjects;
  };

  enrichWithTeachers = async (
    classes: ClassEntity[],
  ): Promise<ClassEntity[]> => {
    if (!classes.length) return classes;

    const allTeacherIds = new Set<string>();
    classes.forEach((c) => {
      (c.classTeacherIds || []).forEach((id) => allTeacherIds.add(id));
      if (c.classTeacherId) allTeacherIds.add(c.classTeacherId);
      (c.classSubjects || []).forEach((cs) => {
        (cs.teacherIds || []).forEach((id) => allTeacherIds.add(id));
        if (cs.subjectTeacherId) allTeacherIds.add(cs.subjectTeacherId);
      });
    });

    if (allTeacherIds.size === 0) {
      classes.forEach((c) => {
        c.classTeachers = c.classTeacher ? [c.classTeacher] : [];
        (c.classSubjects || []).forEach((cs) => {
          cs.teachers = cs.subjectTeacher ? [cs.subjectTeacher] : [];
        });
      });
      return classes;
    }

    const teachers = await this.usersRepository.findBy({
      id: In(Array.from(allTeacherIds)),
    });
    const teacherMap = new Map<string, User>(teachers.map((t) => [t.id, t]));

    classes.forEach((c) => {
      const classIds =
        c.classTeacherIds && c.classTeacherIds.length > 0
          ? c.classTeacherIds
          : c.classTeacherId
            ? [c.classTeacherId]
            : [];
      c.classTeachers = classIds
        .map((id) => teacherMap.get(id))
        .filter(Boolean) as User[];
      if (!c.classTeacher && c.classTeachers.length > 0) {
        c.classTeacher = c.classTeachers[0];
      }

      (c.classSubjects || []).forEach((cs) => {
        const subIds =
          cs.teacherIds && cs.teacherIds.length > 0
            ? cs.teacherIds
            : cs.subjectTeacherId
              ? [cs.subjectTeacherId]
              : [];
        cs.teachers = subIds
          .map((id) => teacherMap.get(id))
          .filter(Boolean) as User[];
        if (!cs.subjectTeacher && cs.teachers.length > 0) {
          cs.subjectTeacher = cs.teachers[0];
        }
      });
    });

    return classes;
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
      .getRawMany<{ classId: string; totalNoOfStudents: string | number }>()
      .then((rawCounts) => {
        const countsMap = new Map<string, number>(
          rawCounts.map((row) => [row.classId, Number(row.totalNoOfStudents)]),
        );
        classes.forEach((c) => {
          c.totalNoOfStudents = countsMap.get(c.id) || 0;
        });
        return classes;
      });
  };

  getClassesBySchool = (
    schoolId: string,
    pagination?: PaginationArgs,
    search?: string,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.classesRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.classTeacher', 'classTeacher')
      .leftJoinAndSelect('class.classSubjects', 'classSubjects')
      .leftJoinAndSelect('classSubjects.subject', 'subject')
      .leftJoinAndSelect('classSubjects.subjectTeacher', 'subjectTeacher')
      .where('class.schoolId = :schoolId', { schoolId });
    if (search?.trim()) {
      queryBuilder.andWhere('class.name ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    return queryBuilder
      .orderBy('class.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount()
      .then(([items, total]) =>
        this.enrichWithStudentCounts(items, schoolId)
          .then((enriched) => this.enrichWithTeachers(enriched))
          .then((enriched) => ({
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
        return this.enrichWithStudentCounts([classEntity], schoolId)
          .then(([enriched]) => this.enrichWithTeachers([enriched]))
          .then(([enriched]) => enriched);
      });
  };

  getClassesForTeacher = (
    teacherId: string,
    schoolId: string,
    role?: UserRole,
  ) =>
    this.classesRepository
      .createQueryBuilder('class')
      .select('class.id')
      .leftJoin('class_subjects', 'cs', 'cs."classId" = class.id')
      .where('class."schoolId" = :schoolId', { schoolId })
      .andWhere(
        role === UserRole.CLASS_TEACHER
          ? '(class."classTeacherId" = :teacherId OR :teacherId = ANY(class."classTeacherIds"))'
          : role === UserRole.SUBJECT_TEACHER
            ? '(cs."subjectTeacherId" = :teacherId OR :teacherId = ANY(cs."teacherIds"))'
            : '(class."classTeacherId" = :teacherId OR :teacherId = ANY(class."classTeacherIds") OR cs."subjectTeacherId" = :teacherId OR :teacherId = ANY(cs."teacherIds"))',
        { teacherId },
      )
      .groupBy('class.id')
      .getMany()
      .then((partial) => {
        const ids = partial.map((c) => c.id);
        if (ids.length === 0) return [];
        return this.classesRepository
          .find({
            where: { id: In(ids) },
            relations: [
              'classTeacher',
              'classSubjects',
              'classSubjects.subject',
              'classSubjects.subjectTeacher',
            ],
            order: { name: 'ASC' },
          })
          .then((classes) => this.enrichWithTeachers(classes));
      });

  getClassesForTeacherPaginated = (
    teacherId: string,
    schoolId: string,
    pagination?: PaginationArgs,
    search?: string,
    role?: UserRole,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    return this.getClassesForTeacher(teacherId, schoolId, role).then((all) => {
      const filtered = search?.trim()
        ? all.filter((c) =>
            c.name.toLowerCase().includes(search.trim().toLowerCase()),
          )
        : all;
      return this.enrichWithStudentCounts(filtered, schoolId).then(
        (enriched) => ({
          items: enriched.slice(skip, skip + limit),
          total: enriched.length,
          page,
          totalPages: Math.ceil(enriched.length / limit),
        }),
      );
    });
  };

  getTeacherClassIds = (
    teacherId: string,
    schoolId: string,
    role?: UserRole,
  ): Promise<string[]> =>
    this.getClassesForTeacher(teacherId, schoolId, role).then((classes) =>
      classes.map((c) => c.id),
    );

  isClassTeacherOfClass = (
    classId: string,
    userId: string,
    schoolId: string,
  ): Promise<boolean> => {
    return this.classesRepository
      .createQueryBuilder('class')
      .where('class.id = :classId', { classId })
      .andWhere('class.schoolId = :schoolId', { schoolId })
      .andWhere(
        '(class.classTeacherId = :userId OR :userId = ANY(class.classTeacherIds))',
        { userId },
      )
      .getOne()
      .then((classEntity) => Boolean(classEntity));
  };
}
