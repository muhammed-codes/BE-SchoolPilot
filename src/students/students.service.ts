import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Upload } from 'graphql-upload-ts';
import { Student } from './entities/student.entity';
import { StudentParent } from './entities/student-parent.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult, FailedRow } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
import { UsersService } from '../users/users.service';
import { UploadService } from '../upload/upload.service';
import { UserRole } from '../common/enums';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentsRepository: Repository<StudentParent>,
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
    private readonly classesService: ClassesService,
  ) {}

  createStudent(input: CreateStudentInput, schoolId: string) {
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
  }

  updateStudent(id: string, input: any, schoolId: string) {
    return this.getStudentById(id, schoolId).then((student) => {
      const updateData: any = { ...input };

      const validateClass = input.classId
        ? this.classesService
            .getClassById(input.classId, schoolId)
            .then((cls) => {
              if (!cls) throw new NotFoundException('Class not found');
              updateData.currentClassId = input.classId;
              delete updateData.classId;
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
      if (!input.admissionNumber) {
        failed.push({ row: index + 1, reason: 'admissionNumber is required' });
        return;
      }
      if (!input.dateOfBirth) {
        failed.push({ row: index + 1, reason: 'dateOfBirth is required' });
        return;
      }
      validStudents.push({
        firstName: input.firstName,
        lastName: input.lastName,
        admissionNumber: input.admissionNumber,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        currentClassId: input.classId,
        address: input.address,
        stateOfOrigin: input.stateOfOrigin,
        schoolId,
      });
    });

    return this.dataSource
      .transaction((manager) => {
        const studentEntities = validStudents.map((s) =>
          manager.create(Student, s),
        );
        return manager.save(Student, studentEntities);
      })
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

  uploadPassportPhoto = (studentId: string, file: Upload, schoolId: string) => {
    return this.getStudentById(studentId, schoolId).then((student) => {
      const deleteOld = student.passportPhotoPublicId
        ? this.uploadService.deleteFile(student.passportPhotoPublicId)
        : Promise.resolve();

      return deleteOld
        .then(() => this.uploadService.uploadFile(file, 'student-passports'))
        .then((result) =>
          this.studentsRepository
            .update(studentId, {
              passportPhotoUrl: result.url,
              passportPhotoPublicId: result.publicId,
            })
            .then(() => this.getStudentById(studentId, schoolId)),
        );
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

  searchStudents = (query: string, schoolId: string) => {
    return this.studentsRepository.find({
      where: [
        { firstName: ILike(`%${query}%`), schoolId, isArchived: false },
        { lastName: ILike(`%${query}%`), schoolId, isArchived: false },
        { admissionNumber: ILike(`%${query}%`), schoolId, isArchived: false },
      ],
      relations: ['currentClass'],
      order: { firstName: 'ASC' },
    });
  };

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
