import { Repository } from 'typeorm';
import { StudentResult } from '../results/entities/student-result.entity';
import { ResultSheet } from '../results/entities/result-sheet.entity';
import { Student } from '../students/entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { Term } from '../terms/entities/term.entity';
import { Session } from '../terms/entities/session.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { UploadService } from '../upload/upload.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Subject } from '../subjects/entities/subject.entity';
import { BulkPDFResult } from './dto/pdf.dto';
export declare class PdfService {
    private readonly studentResultRepo;
    private readonly resultSheetRepo;
    private readonly studentRepo;
    private readonly schoolRepo;
    private readonly termRepo;
    private readonly sessionRepo;
    private readonly classRepo;
    private readonly subjectRepo;
    private readonly uploadService;
    private readonly attendanceService;
    private readonly logger;
    constructor(studentResultRepo: Repository<StudentResult>, resultSheetRepo: Repository<ResultSheet>, studentRepo: Repository<Student>, schoolRepo: Repository<School>, termRepo: Repository<Term>, sessionRepo: Repository<Session>, classRepo: Repository<ClassEntity>, subjectRepo: Repository<Subject>, uploadService: UploadService, attendanceService: AttendanceService);
    generatePdfFromHtml: (html: string) => Promise<Buffer>;
    generateReportCard: (studentResultId: string) => Promise<string>;
    generateBulkReportCards: (resultSheetId: string) => Promise<BulkPDFResult>;
}
