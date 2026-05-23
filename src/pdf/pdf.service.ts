import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
import { UserRole } from '../common/enums';
import { getReportCardTemplate } from './templates/templates';
import {
  ReportCardData,
  ScoreComponentData,
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

  private computePercentage = (
    totalScore: number | null | undefined,
    subjectCount: number,
    scoreComponents: { maxScore: number }[],
  ) => {
    const totalMaxPerSubject = (scoreComponents || []).reduce(
      (sum, sc) => sum + sc.maxScore,
      0,
    );
    if (!subjectCount || totalMaxPerSubject <= 0) return null;
    const obtainable = totalMaxPerSubject * subjectCount;
    const obtained = totalScore || 0;
    if (obtainable <= 0) return null;
    return Number(((obtained / obtainable) * 100).toFixed(2));
  };

  private formatNamePrefix = (prefix: string | null | undefined) => {
    if (!prefix) return '';
    const normalized = prefix.toLowerCase();
    if (normalized === 'mr') return 'Mr.';
    if (normalized === 'mrs') return 'Mrs.';
    if (normalized === 'miss') return 'Miss';
    return '';
  };

  private toSafeNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  private validateGenerationAccess = (
    userId: string,
    schoolId: string,
    role: UserRole,
    classId: string,
  ) => {
    if (role === UserRole.SUBJECT_TEACHER || role === UserRole.PARENT) {
      throw new ForbiddenException(
        'You are not allowed to generate result sheets',
      );
    }

    if (role !== UserRole.CLASS_TEACHER) return Promise.resolve();

    return this.classRepo
      .findOne({ where: { id: classId, schoolId } })
      .then((classEntity) => {
        if (!classEntity) throw new NotFoundException('Class not found');
        if (classEntity.classTeacherId !== userId) {
          throw new ForbiddenException(
            'You can only generate results for your assigned class',
          );
        }
      });
  };

  generatePdfFromHtml = (html: string): Promise<Buffer> => {
    let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>>;

    return puppeteer
      .launch({
        headless: true,
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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

  generateReportCard = (
    studentResultId: string,
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<string> => {
    return this.studentResultRepo
      .findOne({
        where: { id: studentResultId, schoolId },
        relations: ['resultSheet', 'subjectScores', 'subjectScores.subject'],
      })
      .then((studentResult) => {
        if (!studentResult)
          throw new NotFoundException('StudentResult not found');

        return this.validateGenerationAccess(
          userId,
          schoolId,
          role,
          studentResult.resultSheet.classId,
        ).then(() =>
          Promise.all([
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
          ]),
        );
      })
      .then(([studentResult, student, school, term, attendance, subjects]) => {
        if (!student) throw new NotFoundException('Student not found');
        if (!school) throw new NotFoundException('School not found');
        if (!term || !term.session)
          throw new NotFoundException('Term or Session not found');

        const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
        const scoreComponents: ScoreComponentData[] = (
          studentResult.resultSheet?.scoreComponents || []
        ).map((component) => ({
          component: component.component,
          maxScore: component.maxScore,
        }));

        const subjectScoresData: SubjectScoreData[] = (
          studentResult.subjectScores || []
        )
          .filter((score) => score.isSubmitted)
          .map((score) => {
            const componentScores = scoreComponents.map((componentDef) => {
              const matchingScore = (score.scores || []).find(
                (componentScore) =>
                  componentScore.component === componentDef.component,
              );
              if (!matchingScore) {
                return { component: componentDef.component, score: null };
              }
              return {
                component: componentDef.component,
                score: this.toSafeNumber(matchingScore.score),
              };
            });

            return {
              name:
                score.subject?.name ||
                subjectMap.get(score.subjectId) ||
                'Unknown Subject',
              componentScores,
              totalScore: score.totalScore,
              grade: score.grade,
            };
          });

        const sheetScoreComponents = studentResult.resultSheet?.scoreComponents || [];
        const percentage = this.computePercentage(
          studentResult.totalScore,
          (studentResult.subjectScores || []).length,
          sheetScoreComponents,
        );
        const prefix = this.formatNamePrefix(
          student.currentClass?.classTeacher?.namePrefix,
        );
        const rawClassTeacherName = student.currentClass?.classTeacher?.fullName || null;
        const classTeacherName =
          rawClassTeacherName && prefix
            ? `${prefix} ${rawClassTeacherName}`
            : rawClassTeacherName;

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
            percentage,
            position: studentResult.position,
            classTeacherRemark: studentResult.classTeacherRemark,
            principalRemark: studentResult.principalRemark,
          },
          scoreComponents,
          subjectScores: subjectScoresData,
          attendance: {
            daysPresent: attendance.daysPresent,
            daysAbsent: attendance.daysAbsent,
            daysLate: attendance.daysLate,
          },
          staff: {
            classTeacherName,
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

  generateBulkReportCards = (
    resultSheetId: string,
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<BulkPDFResult> => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((resultSheet) => {
        if (!resultSheet) throw new NotFoundException('ResultSheet not found');

        return this.validateGenerationAccess(
          userId,
          schoolId,
          role,
          resultSheet.classId,
        ).then(() =>
          this.studentResultRepo.find({
            where: { resultSheetId, schoolId },
            relations: ['subjectScores'],
          }),
        );
      })
      .then((studentResults) => {
        const hasSubmittedScores = studentResults.some((result) =>
          (result.subjectScores || []).some((score) => score.isSubmitted),
        );
        if (!hasSubmittedScores) {
          throw new BadRequestException(
            'At least one submitted subject score is required to generate results',
          );
        }

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
                    this.generateReportCard(
                      currentResult.id,
                      userId,
                      schoolId,
                      role,
                    ).then((pdfUrl) => {
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
