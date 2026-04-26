"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const puppeteer_1 = __importDefault(require("puppeteer"));
const student_result_entity_1 = require("../results/entities/student-result.entity");
const result_sheet_entity_1 = require("../results/entities/result-sheet.entity");
const student_entity_1 = require("../students/entities/student.entity");
const school_entity_1 = require("../schools/entities/school.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const session_entity_1 = require("../terms/entities/session.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const upload_service_1 = require("../upload/upload.service");
const attendance_service_1 = require("../attendance/attendance.service");
const subject_entity_1 = require("../subjects/entities/subject.entity");
const enums_1 = require("../common/enums");
const templates_1 = require("./templates/templates");
let PdfService = PdfService_1 = class PdfService {
    studentResultRepo;
    resultSheetRepo;
    studentRepo;
    schoolRepo;
    termRepo;
    sessionRepo;
    classRepo;
    subjectRepo;
    uploadService;
    attendanceService;
    logger = new common_1.Logger(PdfService_1.name);
    constructor(studentResultRepo, resultSheetRepo, studentRepo, schoolRepo, termRepo, sessionRepo, classRepo, subjectRepo, uploadService, attendanceService) {
        this.studentResultRepo = studentResultRepo;
        this.resultSheetRepo = resultSheetRepo;
        this.studentRepo = studentRepo;
        this.schoolRepo = schoolRepo;
        this.termRepo = termRepo;
        this.sessionRepo = sessionRepo;
        this.classRepo = classRepo;
        this.subjectRepo = subjectRepo;
        this.uploadService = uploadService;
        this.attendanceService = attendanceService;
    }
    generatePdfFromHtml = (html) => {
        let browserInstance;
        return puppeteer_1.default
            .launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
            .then((browser) => {
            browserInstance = browser;
            return browser.newPage();
        })
            .then((page) => {
            return page.setContent(html, { waitUntil: 'networkidle0' }).then(() => page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '15mm',
                    right: '15mm',
                },
            }));
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
    generateReportCard = (studentResultId) => {
        return this.studentResultRepo
            .findOne({
            where: { id: studentResultId },
            relations: ['resultSheet', 'subjectScores'],
        })
            .then((studentResult) => {
            if (!studentResult)
                throw new common_1.NotFoundException('StudentResult not found');
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
                this.attendanceService.getStudentAttendanceSummary(studentResult.studentId, studentResult.resultSheet.termId),
                this.subjectRepo.find({
                    where: { schoolId: studentResult.schoolId },
                }),
            ]);
        })
            .then(([studentResult, student, school, term, attendance, subjects]) => {
            if (!student)
                throw new common_1.NotFoundException('Student not found');
            if (!school)
                throw new common_1.NotFoundException('School not found');
            if (!term || !term.session)
                throw new common_1.NotFoundException('Term or Session not found');
            const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
            const subjectScoresData = (studentResult.subjectScores || []).map((score) => {
                let assignments = null;
                let tests = null;
                let exam = null;
                if (score.scores) {
                    score.scores.forEach((c) => {
                        const nameLower = c.component.toLowerCase();
                        if (nameLower.includes('assignment'))
                            assignments = c.score;
                        else if (nameLower.includes('test'))
                            tests = c.score;
                        else if (nameLower.includes('exam'))
                            exam = c.score;
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
            const reportCardData = {
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
                    classTeacherName: student.currentClass?.classTeacher?.fullName || null,
                    principalName: 'Principal',
                },
            };
            const templateFn = (0, templates_1.getReportCardTemplate)(school.defaultReportTemplate);
            const htmlContent = templateFn(reportCardData);
            return this.generatePdfFromHtml(htmlContent).then((pdfBuffer) => {
                const filename = `report_card_${student.admissionNumber.replace(/\s+/g, '_')}_${Date.now()}`;
                return this.uploadService.uploadBuffer(pdfBuffer, 'report-cards', filename);
            });
        })
            .then((uploadResult) => uploadResult.pdfPrivateUrl || uploadResult.url);
    };
    generateBulkReportCards = (resultSheetId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId } })
            .then((resultSheet) => {
            if (!resultSheet)
                throw new common_1.NotFoundException('ResultSheet not found');
            if (resultSheet.status !== enums_1.ResultStatus.PUBLISHED) {
                throw new common_1.BadRequestException('Result sheet must be published before generating report cards');
            }
            return this.studentResultRepo.find({
                where: { resultSheetId },
            });
        })
            .then((studentResults) => {
            const studentIds = studentResults.map((sr) => sr.studentId);
            return this.studentRepo
                .find({
                where: { id: (0, typeorm_2.In)(studentIds) },
            })
                .then((students) => {
                const studentMap = new Map(students.map((s) => [s.id, s.fullName]));
                const reportCards = [];
                return studentResults
                    .reduce((promiseChain, currentResult) => promiseChain.then(() => this.generateReportCard(currentResult.id).then((pdfUrl) => {
                    reportCards.push({
                        studentId: currentResult.studentId,
                        studentName: studentMap.get(currentResult.studentId) ||
                            'Unknown Student',
                        pdfUrl,
                    });
                })), Promise.resolve())
                    .then(() => {
                    return {
                        totalGenerated: reportCards.length,
                        reportCards,
                    };
                });
            });
        });
    };
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_result_entity_1.StudentResult)),
    __param(1, (0, typeorm_1.InjectRepository)(result_sheet_entity_1.ResultSheet)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __param(4, (0, typeorm_1.InjectRepository)(term_entity_1.Term)),
    __param(5, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(6, (0, typeorm_1.InjectRepository)(class_entity_1.ClassEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        upload_service_1.UploadService,
        attendance_service_1.AttendanceService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map