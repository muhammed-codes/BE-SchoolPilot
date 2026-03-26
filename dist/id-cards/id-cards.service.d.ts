import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { StudentCardData, StaffCardData } from './interfaces/card-data.interface';
import { BulkCardResult } from './dto/bulk-card-result.type';
import { SchoolsService } from '../schools/schools.service';
import { PdfService } from '../pdf/pdf.service';
import { UploadService } from '../upload/upload.service';
export declare class IdCardsService {
    private readonly studentsRepository;
    private readonly usersRepository;
    private readonly schoolsService;
    private readonly pdfService;
    private readonly uploadService;
    constructor(studentsRepository: Repository<Student>, usersRepository: Repository<User>, schoolsService: SchoolsService, pdfService: PdfService, uploadService: UploadService);
    generateStaffId: (schoolId: string, schoolName: string) => Promise<string>;
    generateQrCodeBase64: (data: string) => Promise<string>;
    getStudentCardData: (studentId: string) => Promise<StudentCardData>;
    getStaffCardData: (userId: string) => Promise<StaffCardData>;
    generateStudentCard: (studentId: string, schoolId: string) => Promise<string>;
    generateBulkStudentCards: (classId: string, schoolId: string) => Promise<BulkCardResult>;
    generateStaffCard: (userId: string, schoolId: string) => Promise<string>;
    generateBulkStaffCards: (schoolId: string) => Promise<BulkCardResult>;
}
