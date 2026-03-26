"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdCardsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const QRCode = __importStar(require("qrcode"));
const student_entity_1 = require("../students/entities/student.entity");
const user_entity_1 = require("../users/entities/user.entity");
const fetch_image_helper_1 = require("./helpers/fetch-image.helper");
const templates_1 = require("./templates");
const bulk_layout_template_1 = require("./templates/bulk-layout.template");
const schools_service_1 = require("../schools/schools.service");
const pdf_service_1 = require("../pdf/pdf.service");
const upload_service_1 = require("../upload/upload.service");
const enums_1 = require("../common/enums");
const STAFF_ROLES = [
    enums_1.UserRole.SCHOOL_ADMIN,
    enums_1.UserRole.PRINCIPAL,
    enums_1.UserRole.CLASS_TEACHER,
    enums_1.UserRole.SUBJECT_TEACHER,
];
let IdCardsService = class IdCardsService {
    studentsRepository;
    usersRepository;
    schoolsService;
    pdfService;
    uploadService;
    constructor(studentsRepository, usersRepository, schoolsService, pdfService, uploadService) {
        this.studentsRepository = studentsRepository;
        this.usersRepository = usersRepository;
        this.schoolsService = schoolsService;
        this.pdfService = pdfService;
        this.uploadService = uploadService;
    }
    generateStaffId = (schoolId, schoolName) => {
        const consonants = schoolName.replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
        const prefix = (consonants.length >= 3
            ? consonants.slice(0, 3)
            : schoolName.replace(/[^a-zA-Z]/g, '').slice(0, 3)).toUpperCase();
        const year = new Date().getFullYear();
        const pattern = `${prefix}-${year}-%`;
        return this.usersRepository
            .createQueryBuilder('user')
            .select('user.staffId')
            .where('user.schoolId = :schoolId', { schoolId })
            .andWhere('user.staffId LIKE :pattern', { pattern })
            .orderBy('user.staffId', 'DESC')
            .limit(1)
            .getOne()
            .then((lastUser) => {
            let sequence = 1;
            if (lastUser?.staffId) {
                const parts = lastUser.staffId.split('-');
                sequence = parseInt(parts[2], 10) + 1;
            }
            return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
        });
    };
    generateQrCodeBase64 = (data) => {
        return QRCode.toDataURL(data, {
            width: 120,
            margin: 1,
            color: { dark: '#1A56A8', light: '#FFFFFF' },
        });
    };
    getStudentCardData = (studentId) => {
        return this.studentsRepository
            .findOne({
            where: { id: studentId },
            relations: ['currentClass'],
        })
            .then((student) => {
            if (!student)
                throw new common_1.NotFoundException('Student not found');
            return this.schoolsService.findById(student.schoolId).then((school) => Promise.all([
                (0, fetch_image_helper_1.fetchImageAsBase64)(student.passportPhotoUrl),
                (0, fetch_image_helper_1.fetchImageAsBase64)(school.logoUrl),
                this.generateQrCodeBase64(student.admissionNumber),
            ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
                studentName: student.fullName,
                admissionNumber: student.admissionNumber,
                className: student.currentClass?.name || 'N/A',
                schoolName: school.name,
                schoolLogoBase64,
                photoBase64,
                qrCodeBase64,
                session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
                gender: student.gender,
            })));
        });
    };
    getStaffCardData = (userId) => {
        return this.usersRepository
            .findOne({ where: { id: userId } })
            .then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            return this.schoolsService.findById(user.schoolId).then((school) => Promise.all([
                (0, fetch_image_helper_1.fetchImageAsBase64)(user.avatarUrl),
                (0, fetch_image_helper_1.fetchImageAsBase64)(school.logoUrl),
                this.generateQrCodeBase64(user.id),
            ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
                staffName: user.fullName,
                staffId: user.staffId || 'N/A',
                role: user.role,
                schoolName: school.name,
                schoolLogoBase64,
                photoBase64,
                qrCodeBase64,
                session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            })));
        });
    };
    generateStudentCard = (studentId, schoolId) => {
        return this.getStudentCardData(studentId).then((data) => {
            return this.schoolsService.findById(schoolId).then((school) => {
                const templateFn = (0, templates_1.getTemplate)(school.defaultReportTemplate || 'classic');
                const cardHtml = templateFn(data);
                const fullHtml = (0, bulk_layout_template_1.singleCardLayout)(cardHtml);
                return this.pdfService
                    .generatePdfFromHtml(fullHtml)
                    .then((buffer) => this.uploadService.uploadBuffer(buffer, 'id-cards/students', `student-${studentId}-${Date.now()}`))
                    .then((result) => result.url);
            });
        });
    };
    generateBulkStudentCards = (classId, schoolId) => {
        return this.studentsRepository
            .find({
            where: { currentClassId: classId, schoolId, isArchived: false },
            relations: ['currentClass'],
            order: { firstName: 'ASC' },
        })
            .then((students) => {
            if (!students.length)
                throw new common_1.NotFoundException('No students found in this class');
            const className = students[0].currentClass?.name || 'Unknown';
            return this.schoolsService.findById(schoolId).then((school) => {
                const cardDataPromises = students.map((student) => Promise.all([
                    (0, fetch_image_helper_1.fetchImageAsBase64)(student.passportPhotoUrl),
                    (0, fetch_image_helper_1.fetchImageAsBase64)(school.logoUrl),
                    this.generateQrCodeBase64(student.admissionNumber),
                ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
                    studentName: student.fullName,
                    admissionNumber: student.admissionNumber,
                    className: student.currentClass?.name || 'N/A',
                    schoolName: school.name,
                    schoolLogoBase64,
                    photoBase64,
                    qrCodeBase64,
                    session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
                    gender: student.gender,
                })));
                return Promise.all(cardDataPromises).then((allCardData) => {
                    const templateFn = (0, templates_1.getTemplate)(school.defaultReportTemplate || 'classic');
                    const cardHtmls = allCardData.map((d) => templateFn(d));
                    const fullHtml = (0, bulk_layout_template_1.bulkLayoutTemplate)(cardHtmls);
                    return this.pdfService
                        .generatePdfFromHtml(fullHtml)
                        .then((buffer) => this.uploadService.uploadBuffer(buffer, 'id-cards/students', `class-${classId}-${Date.now()}`))
                        .then((result) => ({
                        totalCards: students.length,
                        pdfUrl: result.url,
                        label: className,
                    }));
                });
            });
        });
    };
    generateStaffCard = (userId, schoolId) => {
        return this.getStaffCardData(userId).then((data) => {
            return this.schoolsService.findById(schoolId).then((school) => {
                const templateFn = (0, templates_1.getTemplate)(school.defaultReportTemplate || 'classic');
                const cardHtml = templateFn(data);
                const fullHtml = (0, bulk_layout_template_1.singleCardLayout)(cardHtml);
                return this.pdfService
                    .generatePdfFromHtml(fullHtml)
                    .then((buffer) => this.uploadService.uploadBuffer(buffer, 'id-cards/staff', `staff-${userId}-${Date.now()}`))
                    .then((result) => result.url);
            });
        });
    };
    generateBulkStaffCards = (schoolId) => {
        return this.usersRepository
            .find({
            where: {
                schoolId,
                isActive: true,
                role: (0, typeorm_2.In)(STAFF_ROLES),
            },
            order: { firstName: 'ASC' },
        })
            .then((users) => {
            if (!users.length)
                throw new common_1.NotFoundException('No staff found');
            return this.schoolsService.findById(schoolId).then((school) => {
                const cardDataPromises = users.map((user) => Promise.all([
                    (0, fetch_image_helper_1.fetchImageAsBase64)(user.avatarUrl),
                    (0, fetch_image_helper_1.fetchImageAsBase64)(school.logoUrl),
                    this.generateQrCodeBase64(user.id),
                ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
                    staffName: user.fullName,
                    staffId: user.staffId || 'N/A',
                    role: user.role,
                    schoolName: school.name,
                    schoolLogoBase64,
                    photoBase64,
                    qrCodeBase64,
                    session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
                })));
                return Promise.all(cardDataPromises).then((allCardData) => {
                    const templateFn = (0, templates_1.getTemplate)(school.defaultReportTemplate || 'classic');
                    const cardHtmls = allCardData.map((d) => templateFn(d));
                    const fullHtml = (0, bulk_layout_template_1.bulkLayoutTemplate)(cardHtmls);
                    return this.pdfService
                        .generatePdfFromHtml(fullHtml)
                        .then((buffer) => this.uploadService.uploadBuffer(buffer, 'id-cards/staff', `school-staff-${schoolId}-${Date.now()}`))
                        .then((result) => ({
                        totalCards: users.length,
                        pdfUrl: result.url,
                        label: school.name,
                    }));
                });
            });
        });
    };
};
exports.IdCardsService = IdCardsService;
exports.IdCardsService = IdCardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        schools_service_1.SchoolsService,
        pdf_service_1.PdfService,
        upload_service_1.UploadService])
], IdCardsService);
//# sourceMappingURL=id-cards.service.js.map