"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const result_sheet_entity_1 = require("./entities/result-sheet.entity");
const student_result_entity_1 = require("./entities/student-result.entity");
const subject_score_entity_1 = require("./entities/subject-score.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const class_subject_entity_1 = require("../classes/entities/class-subject.entity");
const student_entity_1 = require("../students/entities/student.entity");
const student_parent_entity_1 = require("../students/entities/student-parent.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const user_entity_1 = require("../users/entities/user.entity");
const results_service_1 = require("./results.service");
const results_resolver_1 = require("./results.resolver");
const notifications_module_1 = require("../notifications/notifications.module");
let ResultsModule = class ResultsModule {
};
exports.ResultsModule = ResultsModule;
exports.ResultsModule = ResultsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                result_sheet_entity_1.ResultSheet,
                student_result_entity_1.StudentResult,
                subject_score_entity_1.SubjectScore,
                class_entity_1.ClassEntity,
                class_subject_entity_1.ClassSubject,
                student_entity_1.Student,
                student_parent_entity_1.StudentParent,
                term_entity_1.Term,
                user_entity_1.User,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        providers: [results_service_1.ResultsService, results_resolver_1.ResultsResolver],
        exports: [results_service_1.ResultsService],
    })
], ResultsModule);
//# sourceMappingURL=results.module.js.map