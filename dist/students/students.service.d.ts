import { Repository, DataSource } from 'typeorm';
import { Upload } from 'graphql-upload-ts';
import { Student } from './entities/student.entity';
import { StudentParent } from './entities/student-parent.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
import { UsersService } from '../users/users.service';
import { UploadService } from '../upload/upload.service';
export declare class StudentsService {
    private readonly studentsRepository;
    private readonly studentParentsRepository;
    private readonly usersService;
    private readonly uploadService;
    private readonly dataSource;
    constructor(studentsRepository: Repository<Student>, studentParentsRepository: Repository<StudentParent>, usersService: UsersService, uploadService: UploadService, dataSource: DataSource);
    createStudent: (input: CreateStudentInput, schoolId: string) => Promise<Student>;
    bulkImportStudents: (students: CreateStudentInput[], schoolId: string) => Promise<BulkImportResult>;
    linkParent: (studentId: string, parentUserId: string, schoolId: string) => Promise<Student>;
    unlinkParent: (studentId: string, parentUserId: string, schoolId: string) => Promise<boolean>;
    uploadPassportPhoto: (studentId: string, file: Upload, schoolId: string) => Promise<Student>;
    getStudentsByClass: (classId: string, schoolId: string) => Promise<Student[]>;
    getStudentById: (id: string, schoolId: string) => Promise<Student>;
    getStudentsByParent: (parentUserId: string) => Promise<Student[]>;
    searchStudents: (query: string, schoolId: string) => Promise<Student[]>;
    promoteStudents: (input: PromoteStudentsInput, schoolId: string) => Promise<PromotionResult>;
    getArchivedStudents: (schoolId: string) => Promise<Student[]>;
}
