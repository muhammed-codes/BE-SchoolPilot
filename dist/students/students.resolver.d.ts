import { Upload } from 'graphql-upload-ts';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { PromoteStudentsInput } from './dto/promote-students.input';
import { BulkImportResult } from './dto/bulk-import-result.type';
import { PromotionResult } from './dto/promotion-result.type';
export declare class StudentsResolver {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    studentsByClass(classId: string, user: {
        schoolId: string;
    }): Promise<Student[]>;
    student(id: string, user: {
        schoolId: string;
    }): Promise<Student>;
    myChildren(user: {
        sub: string;
    }): Promise<Student[]>;
    searchStudents(query: string, user: {
        schoolId: string;
    }): Promise<Student[]>;
    createStudent(input: CreateStudentInput, user: {
        schoolId: string;
    }): Promise<Student>;
    bulkImportStudents(students: CreateStudentInput[], user: {
        schoolId: string;
    }): Promise<BulkImportResult>;
    linkParent(studentId: string, parentUserId: string, user: {
        schoolId: string;
    }): Promise<Student>;
    unlinkParent(studentId: string, parentUserId: string, user: {
        schoolId: string;
    }): Promise<boolean>;
    uploadPassportPhoto(studentId: string, file: Upload, user: {
        schoolId: string;
    }): Promise<Student>;
    promoteStudents(input: PromoteStudentsInput, user: {
        schoolId: string;
    }): Promise<PromotionResult>;
}
