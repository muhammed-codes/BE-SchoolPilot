import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, EntityManager, In } from 'typeorm';

import { Student } from './entities/student.entity';
import { StudentParent } from './entities/student-parent.entity';
import { AdmissionSequence } from './entities/admission-sequence.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult, FailedRow } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
import { UsersService } from '../users/users.service';
import { UploadService } from '../upload/upload.service';
import { UserRole } from '../common/enums';
import { ClassesService } from '../classes/classes.service';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentsRepository: Repository<StudentParent>,
    @InjectRepository(AdmissionSequence)
    private readonly admissionSequenceRepository: Repository<AdmissionSequence>,
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
    private readonly classesService: ClassesService,
    private readonly schoolsService: SchoolsService,
  ) {}

  private getAdmissionPrefix = (schoolCode: string, year: number) =>
    `STD-${String(year).slice(-2)}-${schoolCode}`;

  private getAdmissionNumber = (prefix: string, sequence: number) =>
    `${prefix}-${String(sequence).padStart(3, '0')}`;

  private getAdmissionContext = (schoolId: string, year: number) => {
    return this.schoolsService.findById(schoolId).then((school) => {
      const schoolCode = school.schoolCode?.trim().toUpperCase();

      if (!schoolCode) {
        throw new BadRequestException(
          'School code is not set. Update school settings to continue.',
        );
      }

      return {
        prefix: this.getAdmissionPrefix(schoolCode, year),
        lockKey: `student-admission:${schoolId}:${year}`,
      };
    });
  };

  private getNextAdmissionSequence = (
    manager: EntityManager,
    schoolId: string,
    year: number,
    lockKey: string,
    count: number = 1,
  ) => {
    return manager
      .query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey])
      .then(() =>
        manager.findOne(AdmissionSequence, {
          where: { schoolId, year },
        }),
      )
      .then((sequence) => {
        if (!sequence) {
          const newSequence = manager.create(AdmissionSequence, {
            schoolId,
            year,
            lastSequence: count,
          });
          return manager.save(AdmissionSequence, newSequence).then(() => 1);
        }
        const start = sequence.lastSequence + 1;
        sequence.lastSequence += count;
        return manager.save(AdmissionSequence, sequence).then(() => start);
      });
  };

  createStudent = (input: CreateStudentInput, schoolId: string) => {
    const admissionYear = new Date().getFullYear();

    return this.classesService.getClassById(input.classId, schoolId).then(() =>
      this.getAdmissionContext(schoolId, admissionYear).then(
        ({ prefix, lockKey }) =>
          this.dataSource.transaction((manager) =>
            this.getNextAdmissionSequence(
              manager,
              schoolId,
              admissionYear,
              lockKey,
            ).then((sequence) => {
              const student = manager.create(Student, {
                firstName: input.firstName,
                middleName: input.middleName,
                lastName: input.lastName,
                admissionNumber: this.getAdmissionNumber(prefix, sequence),
                dateOfBirth: input.dateOfBirth,
                gender: input.gender,
                nationality: input.nationality || 'Nigerian',
                stateOfOrigin: input.stateOfOrigin,
                lga: input.lga,
                status: input.status,
                dateOfAdmission: input.dateOfAdmission,
                admissionClassId: input.admissionClassId,
                currentClassId: input.classId,
                address: input.address,
                medicalInfo: input.medicalInfo,
                notes: input.notes,
                passportPhotoUrl: input.passportPhotoUrl,
                schoolId,
              });

              return manager.save(Student, student);
            }),
          ),
      ),
    );
  };

  updateStudent(id: string, input: UpdateStudentInput, schoolId: string) {
    return this.getStudentById(id, schoolId).then(() => {
      const updateData: Partial<Student> = {};

      if (input.firstName !== undefined) {
        updateData.firstName = input.firstName;
      }
      if (input.middleName !== undefined) {
        updateData.middleName = input.middleName;
      }
      if (input.lastName !== undefined) {
        updateData.lastName = input.lastName;
      }
      if (input.dateOfBirth !== undefined) {
        updateData.dateOfBirth = input.dateOfBirth;
      }
      if (input.gender !== undefined) {
        updateData.gender = input.gender;
      }
      if (input.nationality !== undefined) {
        updateData.nationality = input.nationality;
      }
      if (input.stateOfOrigin !== undefined) {
        updateData.stateOfOrigin = input.stateOfOrigin;
      }
      if (input.lga !== undefined) {
        updateData.lga = input.lga;
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
      }
      if (input.dateOfAdmission !== undefined) {
        updateData.dateOfAdmission = input.dateOfAdmission;
      }
      if (input.admissionClassId !== undefined) {
        updateData.admissionClassId = input.admissionClassId;
      }
      if (input.address !== undefined) {
        updateData.address = input.address;
      }
      if (input.medicalInfo !== undefined) {
        updateData.medicalInfo = input.medicalInfo;
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }
      if (input.passportPhotoUrl !== undefined) {
        updateData.passportPhotoUrl = input.passportPhotoUrl;
      }

      const validateClass = input.classId
        ? this.classesService
            .getClassById(input.classId, schoolId)
            .then((cls) => {
              if (!cls) throw new NotFoundException('Class not found');
              updateData.currentClassId = input.classId;
            })
        : Promise.resolve();

      return validateClass
        .then(() => this.studentsRepository.update(id, updateData))
        .then(() => this.getStudentById(id, schoolId));
    });
  }

  bulkImportStudents = (
    students: CreateStudentInput[],
    schoolId: string,
  ): Promise<BulkImportResult> => {
    const admissionYear = new Date().getFullYear();
    const failed: FailedRow[] = [];
    const validStudents: Partial<Student>[] = [];

    students.forEach((input, index) => {
      if (!input.firstName || !input.lastName) {
        failed.push({
          row: index + 1,
          reason: 'firstName and lastName are required',
        });
        return;
      }
      validStudents.push({
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        nationality: input.nationality || 'Nigerian',
        stateOfOrigin: input.stateOfOrigin,
        lga: input.lga,
        status: input.status,
        dateOfAdmission: input.dateOfAdmission,
        admissionClassId: input.admissionClassId,
        currentClassId: input.classId,
        address: input.address,
        medicalInfo: input.medicalInfo,
        notes: input.notes,
        schoolId,
      });
    });

    return this.getAdmissionContext(schoolId, admissionYear)
      .then(({ prefix, lockKey }) =>
        this.dataSource.transaction((manager) =>
          this.getNextAdmissionSequence(
            manager,
            schoolId,
            admissionYear,
            lockKey,
            validStudents.length,
          ).then((sequenceStart) => {
            const studentEntities = validStudents.map((student, index) =>
              manager.create(Student, {
                ...student,
                admissionNumber: this.getAdmissionNumber(
                  prefix,
                  sequenceStart + index,
                ),
              }),
            );

            return manager.save(Student, studentEntities);
          }),
        ),
      )
      .then((savedStudents) => ({
        imported: savedStudents.length,
        failed,
        students: savedStudents,
      }));
  };

  linkParent = (studentId: string, parentUserId: string, schoolId: string) => {
    return this.getStudentById(studentId, schoolId).then((student) =>
      this.usersService.findById(parentUserId).then((parentUser) => {
        if (!parentUser) throw new NotFoundException('Parent user not found');
        if (parentUser.role !== UserRole.PARENT) {
          throw new BadRequestException('User does not have PARENT role');
        }
        const record = this.studentParentsRepository.create({
          studentId: student.id,
          parentId: parentUser.id,
        });
        return this.studentParentsRepository
          .save(record)
          .then(() => this.getStudentById(studentId, schoolId));
      }),
    );
  };

  unlinkParent = (
    studentId: string,
    parentUserId: string,
    schoolId: string,
  ) => {
    return this.getStudentById(studentId, schoolId).then(() =>
      this.studentParentsRepository
        .findOne({ where: { studentId, parentId: parentUserId } })
        .then((record) => {
          if (!record) {
            throw new NotFoundException('Parent link not found');
          }
          return this.studentParentsRepository.remove(record).then(() => true);
        }),
    );
  };

  uploadPassportPhoto = (
    studentId: string,
    imageUrl: string,
    schoolId: string,
  ) => {
    return this.getStudentById(studentId, schoolId).then(() => {
      return this.studentsRepository
        .update(studentId, {
          passportPhotoUrl: imageUrl,
        })
        .then(() => this.getStudentById(studentId, schoolId));
    });
  };

  getStudentsByClass(classId: string, schoolId: string) {
    return this.studentsRepository.find({
      where: { currentClassId: classId, schoolId, isArchived: false },
      relations: ['currentClass'],
      order: { firstName: 'ASC' },
    });
  }

  getStudentById(id: string, schoolId: string) {
    return this.studentsRepository
      .findOne({
        where: { id, schoolId },
        relations: ['currentClass'],
      })
      .then((student) => {
        if (!student) throw new NotFoundException('Student not found');
        return student;
      });
  }

  getStudentsByParent(parentUserId: string) {
    return this.studentParentsRepository
      .find({
        where: { parentId: parentUserId },
        relations: ['student', 'student.currentClass'],
      })
      .then((records) => records.map((r) => r.student));
  }

  searchStudents = (query: string, schoolId: string, classIds?: string[]) => {
    if (classIds && classIds.length === 0) return Promise.resolve([]);

    const classFilter = classIds ? { currentClassId: In(classIds) } : {};
    const normalizedQuery = query.trim();
    const wildcardQuery = normalizedQuery.replace(/[^a-zA-Z0-9]+/g, '%');
    const admissionQueries = [normalizedQuery, wildcardQuery]
      .filter(
        (value, index, values) => value && values.indexOf(value) === index,
      )
      .map((value) => ({
        admissionNumber: ILike(`%${value}%`),
        schoolId,
        isArchived: false,
        ...classFilter,
      }));

    return this.studentsRepository.find({
      where: [
        {
          firstName: ILike(`%${normalizedQuery}%`),
          schoolId,
          isArchived: false,
          ...classFilter,
        },
        {
          lastName: ILike(`%${normalizedQuery}%`),
          schoolId,
          isArchived: false,
          ...classFilter,
        },
        ...admissionQueries,
      ],
      relations: ['currentClass'],
      order: { firstName: 'ASC' },
    });
  };

  searchStudentsForTeacher = (
    query: string,
    teacherId: string,
    schoolId: string,
  ) =>
    this.classesService
      .getTeacherClassIds(teacherId, schoolId)
      .then((classIds) => this.searchStudents(query, schoolId, classIds));

  promoteStudents = (
    input: PromoteStudentsInput,
    schoolId: string,
  ): Promise<PromotionResult> => {
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
            .update(
              students.map((s) => s.id),
              { isArchived: true },
            )
            .then(() => ({ promoted: 0, archived: students.length }));
        }

        return this.studentsRepository
          .update(
            students.map((s) => s.id),
            { currentClassId: toClassId },
          )
          .then(() => ({ promoted: students.length, archived: 0 }));
      });
  };

  getArchivedStudents = (schoolId: string) => {
    return this.studentsRepository.find({
      where: { schoolId, isArchived: true },
      relations: ['currentClass'],
      order: { firstName: 'ASC' },
    });
  };
}
