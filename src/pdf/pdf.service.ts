import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pathToFileURL } from 'url';
import * as fs from 'fs';

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
import { calculateGrade } from '../results/utils/grading.util';
import { getReportCardTemplate } from './templates/templates';
import {
  ReportCardData,
  ScoreComponentData,
  SubjectScoreData,
} from './templates/report-card-data.interface';

/* eslint-disable @typescript-eslint/no-implied-eval */
const importEsmModule = <TModule>(specifier: string): Promise<TModule> =>
  (
    new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<TModule>
  )(specifier);
/* eslint-enable @typescript-eslint/no-implied-eval */

const loadPuppeteer = (): Promise<PuppeteerModule> =>
  importEsmModule(pathToFileURL(require.resolve('puppeteer-core')).href);

type PuppeteerModule = typeof import('puppeteer-core');
type ChromiumModule = typeof import('@sparticuz/chromium');

const loadChromium = (): Promise<ChromiumModule> =>
  importEsmModule(pathToFileURL(require.resolve('@sparticuz/chromium')).href);

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
    let browserInstance: import('puppeteer-core').Browser | undefined;

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production';

    const resolveLaunchConfig = (): Promise<{
      executablePath: string;
      args: string[];
    }> => {
      if (isProduction) {
        return loadChromium().then(({ default: chromium }) =>
          chromium.executablePath().then((executablePath) => ({
            executablePath,
            args: chromium.args,
          })),
        );
      }

      const candidatePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ].filter(Boolean) as string[];

      const localPath = candidatePaths.find((candidate) =>
        fs.existsSync(candidate),
      );
      if (!localPath) {
        return Promise.reject(
          new Error(
            'PUPPETEER_EXECUTABLE_PATH is not set in .env and no Chrome/Chromium executable was found. Run `which google-chrome-stable` and add the result to .env.',
          ),
        );
      }
      return Promise.resolve({
        executablePath: localPath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
      });
    };

    return Promise.all([resolveLaunchConfig(), loadPuppeteer()])
      .then(([{ executablePath, args }, puppeteerModule]) =>
        puppeteerModule.default.launch({
          headless: true,
          executablePath,
          args,
        }),
      )
      .then((browser) => {
        browserInstance = browser;
        return browser.newPage();
      })
      .then((page) =>
        page.setContent(html, { waitUntil: 'load' }).then(() =>
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
        ),
      )
      .then((pdfBuffer) => {
        const browser = browserInstance;
        if (!browser) throw new Error('PDF browser did not initialize');
        return browser.close().then(() => Buffer.from(pdfBuffer));
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
      .createQueryBuilder('studentResult')
      .innerJoinAndSelect('studentResult.resultSheet', 'resultSheet')
      .leftJoinAndSelect('resultSheet.classEntity', 'historicalClass')
      .leftJoinAndSelect('historicalClass.classTeacher', 'classTeacher')
      .leftJoin('studentResult.subjectScores', 'subjectScore')
      .addSelect([
        'subjectScore.id',
        'subjectScore.studentResultId',
        'subjectScore.subjectId',
        'subjectScore.resultSheetId',
        'subjectScore.scores',
        'subjectScore.totalScore',
        'subjectScore.grade',
        'subjectScore.teacherRemark',
        'subjectScore.isSubmitted',
        'subjectScore.submittedAt',
        'subjectScore.enteredByUserId',
        'subjectScore.createdAt',
        'subjectScore.updatedAt',
      ])
      .leftJoinAndSelect('subjectScore.subject', 'subject')
      .where('studentResult.id = :studentResultId', { studentResultId })
      .andWhere('studentResult.schoolId = :schoolId', { schoolId })
      .getOne()
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
            this.studentResultRepo.count({
              where: { resultSheetId: studentResult.resultSheetId },
            }),
          ]),
        );
      })
      .then(
        ([
          studentResult,
          student,
          school,
          term,
          attendance,
          subjects,
          totalStudentsInClass,
        ]) => {
        if (!student) throw new NotFoundException('Student not found');
        if (!school) throw new NotFoundException('School not found');
        if (!term || !term.session)
          throw new NotFoundException('Term or Session not found');

        const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
        const fallbackComponents: ScoreComponentData[] = (
          studentResult.resultSheet?.scoreComponents || []
        ).map((component) => ({
          component: component.component,
          maxScore: component.maxScore,
        }));
        const gradingSystem = studentResult.resultSheet?.gradingSystem;

        const subjectScoresData: SubjectScoreData[] = (
          studentResult.subjectScores || []
        )
          .filter((score) => score.isSubmitted)
          .map((score) => {
            const configuredComponents: ScoreComponentData[] = (
              score.scoreComponents?.length
                ? score.scoreComponents
                : fallbackComponents
            ).map((component) => ({
              component: component.component,
              maxScore: component.maxScore,
            }));
            const componentScores = configuredComponents.map((componentDef) => {
              const matchingScore = (score.scores || []).find(
                (componentScore) =>
                  String(componentScore.component) ===
                  String(componentDef.component),
              );
              if (!matchingScore) {
                return { ...componentDef, score: null };
              }
              return {
                component: componentDef.component,
                maxScore: componentDef.maxScore,
                score: this.toSafeNumber(matchingScore.score),
              };
            });
            const subjectMaximum = configuredComponents.reduce(
              (sum, component) => sum + component.maxScore,
              0,
            );

            const computedGrade =
              score.totalScore != null && subjectMaximum > 0 && gradingSystem
                ? calculateGrade(
                    score.totalScore,
                    subjectMaximum,
                    gradingSystem,
                  )
                : score.grade;

            return {
              name:
                score.subject?.name ||
                subjectMap.get(score.subjectId) ||
                'Unknown Subject',
              componentScores,
              scoreComponents: configuredComponents,
              totalScore: score.totalScore,
              grade: computedGrade,
            };
          });

        const overallMaximum = (studentResult.subjectScores || []).reduce(
          (sum, score) =>
            sum +
            (score.scoreComponents?.length
              ? score.scoreComponents
              : fallbackComponents
            ).reduce(
              (subjectSum, component) => subjectSum + component.maxScore,
              0,
            ),
          0,
        );
        const percentage =
          studentResult.totalScore != null && overallMaximum > 0
            ? Number(
                ((studentResult.totalScore / overallMaximum) * 100).toFixed(2),
              )
            : null;
        const historicalClass = studentResult.resultSheet?.classEntity;
        const prefix = this.formatNamePrefix(
          historicalClass?.classTeacher?.namePrefix,
        );
        const rawClassTeacherName =
          historicalClass?.classTeacher?.fullName || null;
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
            passportPhotoUrl: student.passportPhotoUrl || null,
            currentClass: historicalClass?.name || 'Unknown Class',
            totalStudentsInClass,
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
          scoreComponents: fallbackComponents,
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

        return htmlContent;
      });
  };

  generateReportCardPdf = (
    studentResultId: string,
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<string> =>
    this.generateReportCard(studentResultId, userId, schoolId, role)
      .then((html) => this.generatePdfFromHtml(html))
      .then((pdfBuffer) => {
        const filename = `report_card_${studentResultId}_${Date.now()}`;
        return this.uploadService
          .uploadBuffer(
            pdfBuffer,
            `schools/${schoolId}/report-cards`,
            filename,
            { format: 'pdf', resourceType: 'raw' },
          )
          .then(
            (uploadResult) =>
              uploadResult.url || uploadResult.pdfPrivateUrl || '',
          )
          .catch((err) => {
            this.logger.warn(
              `Cloudinary upload failed for report card PDF, returning base64 Data URI: ${err}`,
            );
            return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
          });
      });

  generateBulkReportCards = (
    resultSheetId: string,
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<string> => {
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

        const reportCardsHtml: string[] = [];

        return studentResults
          .reduce(
            (promiseChain, currentResult) =>
              promiseChain.then(() =>
                this.generateReportCard(
                  currentResult.id,
                  userId,
                  schoolId,
                  role,
                ).then((html) => {
                  reportCardsHtml.push(html);
                }),
              ),
            Promise.resolve(),
          )
          .then(() => {
            const combinedHtml = reportCardsHtml.join(
              '<div style="page-break-before: always;"></div>',
            );
            return this.generatePdfFromHtml(combinedHtml).then((pdfBuffer) => {
              const filename = `bulk_report_cards_${resultSheetId}_${Date.now()}`;
              return this.uploadService
                .uploadBuffer(
                  pdfBuffer,
                  `schools/${schoolId}/report-cards`,
                  filename,
                  { format: 'pdf', resourceType: 'raw' },
                )
                .then(
                  (uploadResult) =>
                    uploadResult.url || uploadResult.pdfPrivateUrl || '',
                )
                .catch((err) => {
                  this.logger.warn(
                    `Cloudinary upload failed for bulk report card PDF, returning base64 Data URI: ${err}`,
                  );
                  return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
                });
            });
          });
      });
  };
}
