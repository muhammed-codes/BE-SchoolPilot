"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pdf_service_1 = require("./pdf.service");
const pdf_resolver_1 = require("./pdf.resolver");
const upload_module_1 = require("../upload/upload.module");
const attendance_module_1 = require("../attendance/attendance.module");
const student_result_entity_1 = require("../results/entities/student-result.entity");
const result_sheet_entity_1 = require("../results/entities/result-sheet.entity");
const student_entity_1 = require("../students/entities/student.entity");
const school_entity_1 = require("../schools/entities/school.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const session_entity_1 = require("../terms/entities/session.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const subject_entity_1 = require("../subjects/entities/subject.entity");
let PdfModule = class PdfModule {
};
exports.PdfModule = PdfModule;
exports.PdfModule = PdfModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_result_entity_1.StudentResult,
                result_sheet_entity_1.ResultSheet,
                student_entity_1.Student,
                school_entity_1.School,
                term_entity_1.Term,
                session_entity_1.Session,
                class_entity_1.ClassEntity,
                subject_entity_1.Subject,
            ]),
            upload_module_1.UploadModule,
            attendance_module_1.AttendanceModule,
        ],
        providers: [pdf_service_1.PdfService, pdf_resolver_1.PdfResolver],
        exports: [pdf_service_1.PdfService],
    })
], PdfModule);
//# sourceMappingURL=pdf.module.js.map