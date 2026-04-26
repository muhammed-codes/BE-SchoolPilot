import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import puppeteer from 'puppeteer';
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
import { ResultStatus } from '../common/enums';
import { getReportCardTemplate } from './templates/templates';
import {
  ReportCardData,
  SubjectScoreData,
} from './templates/report-card-data.interface';
import { BulkPDFResult } from './dto/pdf.dto';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @InjectRepository(StudentResult)
    private readonly studentResultRepo: Repository<StudentResult>,
    @InjectRepository(ResultSheet)
    private readonly resultSheetRepo: Repository<ResultSheet>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    private readonly uploadService: UploadService,
    private readonly attendanceService: AttendanceService,
  ) {}

  generatePdfFromHtml = (html: string): Promise<Buffer> => {
    let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>>;

    return puppeteer
      .launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      .then((browser) => {
        browserInstance = browser;
        return browser.newPage();
      })
      .then((page) => {
        return page.setContent(html, { waitUntil: 'networkidle0' }).then(() =>
          page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20mm',
              bottom: '20mm',
              left: '15mm',
              right: '15mm',
            },
          }),
        );
      })
      .then((pdfBuffer) => {
        return browserInstance.close().then(() => Buffer.from(pdfBuffer));
      })
      .catch((error) => {
        if (browserInstance) {
          browserInstance
            .close()
            .catch((e) => this.logger.error('Error closing browser', e));
        }
        throw error;
      });
  };

  generateReportCard = (studentResultId: string): Promise<string> => {
    return this.studentResultRepo
      .findOne({
        where: { id: studentResultId },
        relations: ['resultSheet', 'subjectScores'],
      })
      .then((studentResult) => {
        if (!studentResult)
          throw new NotFoundException('StudentResult not found');

        return Promise.all([
          Promise.resolve(studentResult),
          this.studentRepo.findOne({
            where: { id: studentResult.studentId },
            relations: ['currentClass', 'currentClass.classTeacher'],
          }),
          this.schoolRepo.findOne({ where: { id: studentResult.schoolId } }),
          this.termRepo.findOne({
            where: { id: studentResult.resultSheet.termId },
            relations: ['session'],
          }),
          this.attendanceService.getStudentAttendanceSummary(
            studentResult.studentId,
            studentResult.resultSheet.termId,
          ),
          this.subjectRepo.find({
            where: { schoolId: studentResult.schoolId },
          }),
        ]);
      })
      .then(([studentResult, student, school, term, attendance, subjects]) => {
        if (!student) throw new NotFoundException('Student not found');
        if (!school) throw new NotFoundException('School not found');
        if (!term || !term.session)
          throw new NotFoundException('Term or Session not found');

        const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

        const subjectScoresData: SubjectScoreData[] = (
          studentResult.subjectScores || []
        ).map((score) => {
          let assignments: number | null = null;
          let tests: number | null = null;
          let exam: number | null = null;

          if (score.scores) {
            score.scores.forEach((c) => {
              const nameLower = c.component.toLowerCase();
              if (nameLower.includes('assignment')) assignments = c.score;
              else if (nameLower.includes('test')) tests = c.score;
              else if (nameLower.includes('exam')) exam = c.score;
            });
          }

          return {
            name: subjectMap.get(score.subjectId) || 'Unknown Subject',
            assignments,
            tests,
            exam,
            totalScore: score.totalScore,
            grade: score.grade,
          };
        });

        const reportCardData: ReportCardData = {
          school: {
            name: school.name,
            logoUrl: school.logoUrl,
            stampUrl: school.stampUrl,
            address: school.address,
            defaultReportTemplate: school.defaultReportTemplate,
          },
          student: {
            fullName: student.fullName,
            admissionNumber: student.admissionNumber,
            passportPhotoUrl: student.passportPhotoUrl,
            currentClass: student.currentClass?.name || 'Unknown Class',
          },
          term: {
            name: term.name,
            sessionName: term.session.name,
            totalSchoolDays: term.totalSchoolDays,
          },
          result: {
            totalScore: studentResult.totalScore,
            grade: studentResult.grade,
            position: studentResult.position,
            classTeacherRemark: studentResult.classTeacherRemark,
            principalRemark: studentResult.principalRemark,
          },
          subjectScores: subjectScoresData,
          attendance: {
            daysPresent: attendance.daysPresent,
            daysAbsent: attendance.daysAbsent,
            daysLate: attendance.daysLate,
          },
          staff: {
            classTeacherName:
              student.currentClass?.classTeacher?.fullName || null,
            principalName: 'Principal', // Assuming standard principal signing for now
          },
        };

        const templateFn = getReportCardTemplate(school.defaultReportTemplate);
        const htmlContent = templateFn(reportCardData);

        return this.generatePdfFromHtml(htmlContent).then((pdfBuffer) => {
          const filename = `report_card_${student.admissionNumber.replace(/\s+/g, '_')}_${Date.now()}`;
          return this.uploadService.uploadBuffer(
            pdfBuffer,
            'report-cards',
            filename,
          );
        });
      })
      .then((uploadResult) => uploadResult.pdfPrivateUrl || uploadResult.url);
  };

  generateBulkReportCards = (resultSheetId: string): Promise<BulkPDFResult> => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
      .then((resultSheet) => {
        if (!resultSheet) throw new NotFoundException('ResultSheet not found');
        if (resultSheet.status !== ResultStatus.PUBLISHED) {
          throw new BadRequestException(
            'Result sheet must be published before generating report cards',
          );
        }

        return this.studentResultRepo.find({
          where: { resultSheetId },
        });
      })
      .then((studentResults) => {
        const studentIds = studentResults.map((sr) => sr.studentId);
        return this.studentRepo
          .find({
            where: { id: In(studentIds) },
          })
          .then((students) => {
            const studentMap = new Map(students.map((s) => [s.id, s.fullName]));
            const reportCards: any[] = [];

            // Execute sequentially to prevent memory overflow in Puppeteer
            return studentResults
              .reduce(
                (promiseChain, currentResult) =>
                  promiseChain.then(() =>
                    this.generateReportCard(currentResult.id).then((pdfUrl) => {
                      reportCards.push({
                        studentId: currentResult.studentId,
                        studentName:
                          studentMap.get(currentResult.studentId) ||
                          'Unknown Student',
                        pdfUrl,
                      });
                    }),
                  ),
                Promise.resolve(),
              )
              .then(() => {
                return {
                  totalGenerated: reportCards.length,
                  reportCards,
                };
              });
          });
      });
  };
}
