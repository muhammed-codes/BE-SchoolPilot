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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const result_sheet_entity_1 = require("./entities/result-sheet.entity");
const student_result_entity_1 = require("./entities/student-result.entity");
const subject_score_entity_1 = require("./entities/subject-score.entity");
const class_entity_1 = require("../classes/entities/class.entity");
const class_subject_entity_1 = require("../classes/entities/class-subject.entity");
const student_entity_1 = require("../students/entities/student.entity");
const student_parent_entity_1 = require("../students/entities/student-parent.entity");
const term_entity_1 = require("../terms/entities/term.entity");
const user_entity_1 = require("../users/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const enums_1 = require("../common/enums");
const grading_util_1 = require("./utils/grading.util");
let ResultsService = class ResultsService {
    resultSheetRepo;
    studentResultRepo;
    subjectScoreRepo;
    classRepo;
    classSubjectRepo;
    studentRepo;
    studentParentRepo;
    termRepo;
    userRepo;
    notificationsService;
    dataSource;
    constructor(resultSheetRepo, studentResultRepo, subjectScoreRepo, classRepo, classSubjectRepo, studentRepo, studentParentRepo, termRepo, userRepo, notificationsService, dataSource) {
        this.resultSheetRepo = resultSheetRepo;
        this.studentResultRepo = studentResultRepo;
        this.subjectScoreRepo = subjectScoreRepo;
        this.classRepo = classRepo;
        this.classSubjectRepo = classSubjectRepo;
        this.studentRepo = studentRepo;
        this.studentParentRepo = studentParentRepo;
        this.termRepo = termRepo;
        this.userRepo = userRepo;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    createResultSheet = (input, userId, schoolId) => {
        return Promise.all([
            this.classRepo.findOne({
                where: { id: input.classId, schoolId },
            }),
            this.termRepo.findOne({
                where: { id: input.termId, schoolId },
            }),
        ]).then(([classEntity, term]) => {
            if (!classEntity)
                throw new common_1.NotFoundException('Class not found in this school');
            if (!term)
                throw new common_1.NotFoundException('Term not found in this school');
            return this.dataSource.transaction((manager) => {
                const sheet = manager.create(result_sheet_entity_1.ResultSheet, {
                    classId: input.classId,
                    termId: input.termId,
                    schoolId,
                    gradingSystem: input.gradingSystem,
                    scoreComponents: input.scoreComponents,
                    status: enums_1.ResultStatus.DRAFT,
                });
                return manager.save(result_sheet_entity_1.ResultSheet, sheet).then((savedSheet) => this.studentRepo
                    .find({
                    where: {
                        currentClassId: input.classId,
                        schoolId,
                        isArchived: false,
                    },
                })
                    .then((students) => {
                    const studentResults = students.map((student) => manager.create(student_result_entity_1.StudentResult, {
                        resultSheetId: savedSheet.id,
                        studentId: student.id,
                        schoolId,
                    }));
                    return manager
                        .save(student_result_entity_1.StudentResult, studentResults)
                        .then((savedResults) => this.classSubjectRepo
                        .find({ where: { classId: input.classId } })
                        .then((classSubjects) => {
                        const subjectScores = [];
                        savedResults.forEach((sr) => {
                            classSubjects.forEach((cs) => {
                                subjectScores.push(manager.create(subject_score_entity_1.SubjectScore, {
                                    studentResultId: sr.id,
                                    subjectId: cs.subjectId,
                                    resultSheetId: savedSheet.id,
                                    enteredByUserId: userId,
                                    isSubmitted: false,
                                }));
                            });
                        });
                        return manager
                            .save(subject_score_entity_1.SubjectScore, subjectScores)
                            .then(() => manager
                            .findOne(result_sheet_entity_1.ResultSheet, {
                            where: { id: savedSheet.id, schoolId },
                            relations: [
                                'studentResults',
                                'studentResults.subjectScores',
                            ],
                        })
                            .then((sheet) => {
                            if (!sheet)
                                throw new common_1.NotFoundException('Result sheet not found');
                            return sheet;
                        }));
                    }));
                }));
            });
        });
    };
    saveSubjectScores = (input, teacherId, schoolId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: input.resultSheetId, schoolId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.classSubjectRepo
                .findOne({
                where: {
                    classId: sheet.classId,
                    subjectId: input.subjectId,
                    subjectTeacherId: teacherId,
                },
            })
                .then((classSubject) => {
                if (!classSubject)
                    throw new common_1.ForbiddenException('You are not assigned to teach this subject in this class');
                return this.processScores(input, sheet, teacherId);
            });
        });
    };
    saveAdminScores = (input, adminId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: input.resultSheetId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.processScores(input, sheet, adminId);
        });
    };
    processScores = (input, sheet, userId) => {
        const maxScoreMap = new Map(sheet.scoreComponents.map((sc) => [sc.component, sc.maxScore]));
        input.scores.forEach((studentScore) => {
            studentScore.componentScores.forEach((cs) => {
                const maxScore = maxScoreMap.get(cs.component);
                if (maxScore === undefined)
                    throw new common_1.BadRequestException(`Score component ${cs.component} is not configured on this sheet`);
                if (cs.score > maxScore)
                    throw new common_1.BadRequestException(`Score ${cs.score} exceeds max ${maxScore} for component ${cs.component}`);
            });
        });
        const totalMaxScore = sheet.scoreComponents.reduce((sum, sc) => sum + sc.maxScore, 0);
        return Promise.all(input.scores.map((studentScore) => this.subjectScoreRepo
            .findOne({
            where: {
                resultSheetId: sheet.id,
                subjectId: input.subjectId,
                studentResultId: this.dataSource
                    .createQueryBuilder()
                    .subQuery()
                    .select('sr.id')
                    .from(student_result_entity_1.StudentResult, 'sr')
                    .where('sr.resultSheetId = :sheetId', { sheetId: sheet.id })
                    .andWhere('sr.studentId = :studentId', {
                    studentId: studentScore.studentId,
                })
                    .getQuery(),
            },
        })
            .then((existing) => {
            if (!existing) {
                return this.studentResultRepo
                    .findOne({
                    where: {
                        resultSheetId: sheet.id,
                        studentId: studentScore.studentId,
                    },
                })
                    .then((sr) => {
                    if (!sr)
                        throw new common_1.NotFoundException(`Student result not found for student ${studentScore.studentId}`);
                    return this.subjectScoreRepo.findOne({
                        where: {
                            resultSheetId: sheet.id,
                            subjectId: input.subjectId,
                            studentResultId: sr.id,
                        },
                    });
                });
            }
            return existing;
        })
            .then((subjectScore) => {
            if (!subjectScore)
                throw new common_1.NotFoundException(`Subject score entry not found for student ${studentScore.studentId}`);
            const totalScore = studentScore.componentScores.reduce((sum, cs) => sum + cs.score, 0);
            subjectScore.scores = studentScore.componentScores;
            subjectScore.totalScore = totalScore;
            subjectScore.grade = (0, grading_util_1.calculateGrade)(totalScore, totalMaxScore, sheet.gradingSystem);
            subjectScore.enteredByUserId = userId;
            if (input.submit) {
                subjectScore.isSubmitted = true;
                subjectScore.submittedAt = new Date();
            }
            return this.subjectScoreRepo.save(subjectScore);
        }))).then((savedScores) => input.submit
            ? this.checkAndAdvanceStatus(sheet.id).then(() => savedScores)
            : savedScores);
    };
    checkAndAdvanceStatus = (resultSheetId) => {
        return Promise.all([
            this.subjectScoreRepo.count({ where: { resultSheetId } }),
            this.subjectScoreRepo.count({
                where: { resultSheetId, isSubmitted: true },
            }),
        ]).then(([total, submitted]) => {
            if (total > 0 && total === submitted) {
                return this.resultSheetRepo
                    .update(resultSheetId, { status: enums_1.ResultStatus.SCORES_ENTERED })
                    .then(() => this.resultSheetRepo.findOne({ where: { id: resultSheetId } }));
            }
            return this.resultSheetRepo.findOne({ where: { id: resultSheetId } });
        });
    };
    submitForAdminReview = (resultSheetId, adminId, schoolId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId, schoolId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.resultSheetRepo
                .update(resultSheetId, {
                status: enums_1.ResultStatus.PENDING_ADMIN_REVIEW,
            })
                .then(() => this.resultSheetRepo.findOne({ where: { id: resultSheetId } }));
        });
    };
    submitForPrincipalApproval = (resultSheetId, principalId, schoolId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId, schoolId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.resultSheetRepo
                .update(resultSheetId, {
                status: enums_1.ResultStatus.PENDING_PRINCIPAL_APPROVAL,
            })
                .then(() => this.resultSheetRepo.findOne({ where: { id: resultSheetId } }));
        });
    };
    approveResult = (resultSheetId, principalId, schoolId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId, schoolId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.resultSheetRepo
                .update(resultSheetId, { status: enums_1.ResultStatus.PUBLISHED })
                .then(() => this.calculatePositions(resultSheetId))
                .then(() => this.sendResultNotifications(sheet))
                .then(() => this.resultSheetRepo.findOne({ where: { id: resultSheetId } }));
        });
    };
    returnResult = (resultSheetId, returnedById, schoolId, reason) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId, schoolId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return this.resultSheetRepo
                .update(resultSheetId, {
                status: enums_1.ResultStatus.RETURNED,
                returnReason: reason,
            })
                .then(() => this.sendReturnNotification(sheet, reason))
                .then(() => this.resultSheetRepo.findOne({ where: { id: resultSheetId } }));
        });
    };
    calculatePositions = (resultSheetId) => {
        return this.resultSheetRepo
            .findOne({ where: { id: resultSheetId } })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            const totalMaxScore = sheet.scoreComponents.reduce((sum, sc) => sum + sc.maxScore, 0);
            return this.studentResultRepo
                .find({
                where: { resultSheetId },
                relations: ['subjectScores'],
            })
                .then((studentResults) => {
                studentResults.forEach((sr) => {
                    const subjectTotal = sr.subjectScores.reduce((sum, ss) => sum + (ss.totalScore || 0), 0);
                    sr.totalScore = subjectTotal;
                    const subjectCount = sr.subjectScores.length || 1;
                    const overallMaxScore = totalMaxScore * subjectCount;
                    sr.grade = (0, grading_util_1.calculateGrade)(subjectTotal, overallMaxScore, sheet.gradingSystem);
                });
                studentResults.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
                let currentPosition = 1;
                studentResults.forEach((sr, index) => {
                    if (index > 0 &&
                        sr.totalScore === studentResults[index - 1].totalScore) {
                        sr.position = studentResults[index - 1].position;
                    }
                    else {
                        sr.position = currentPosition;
                    }
                    currentPosition = index + 2;
                });
                return this.studentResultRepo.save(studentResults);
            });
        });
    };
    saveTeacherRemark = (subjectScoreId, remark) => {
        return this.subjectScoreRepo
            .findOne({ where: { id: subjectScoreId } })
            .then((score) => {
            if (!score)
                throw new common_1.NotFoundException('Subject score not found');
            score.teacherRemark = remark;
            return this.subjectScoreRepo.save(score);
        });
    };
    savePrincipalRemark = (studentResultId, remark) => {
        return this.studentResultRepo
            .findOne({ where: { id: studentResultId } })
            .then((result) => {
            if (!result)
                throw new common_1.NotFoundException('Student result not found');
            result.principalRemark = remark;
            return this.studentResultRepo.save(result);
        });
    };
    saveClassTeacherRemark = (studentResultId, remark) => {
        return this.studentResultRepo
            .findOne({ where: { id: studentResultId } })
            .then((result) => {
            if (!result)
                throw new common_1.NotFoundException('Student result not found');
            result.classTeacherRemark = remark;
            return this.studentResultRepo.save(result);
        });
    };
    getResultSheet = (id, schoolId) => {
        return this.resultSheetRepo
            .findOne({
            where: { id, schoolId },
            relations: ['studentResults', 'studentResults.subjectScores'],
        })
            .then((sheet) => {
            if (!sheet)
                throw new common_1.NotFoundException('Result sheet not found');
            return sheet;
        });
    };
    getResultSheetsByClass = (classId, termId, schoolId) => {
        return this.resultSheetRepo.find({
            where: { classId, termId, schoolId },
            order: { createdAt: 'DESC' },
        });
    };
    getPendingApprovals = (schoolId) => {
        return this.resultSheetRepo.find({
            where: { schoolId, status: enums_1.ResultStatus.PENDING_PRINCIPAL_APPROVAL },
            order: { createdAt: 'DESC' },
        });
    };
    getSchoolResultSheets = (schoolId, status) => {
        const where = { schoolId };
        if (status)
            where.status = status;
        return this.resultSheetRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    };
    getStudentResult = (studentId, termId) => {
        return this.studentResultRepo
            .createQueryBuilder('sr')
            .innerJoinAndSelect('sr.resultSheet', 'rs')
            .leftJoinAndSelect('sr.subjectScores', 'ss')
            .where('sr.studentId = :studentId', { studentId })
            .andWhere('rs.termId = :termId', { termId })
            .getOne()
            .then((result) => {
            if (!result)
                throw new common_1.NotFoundException('Student result not found');
            return result;
        });
    };
    getMySubjectScores = (teacherId, resultSheetId) => {
        return this.subjectScoreRepo.find({
            where: { resultSheetId, enteredByUserId: teacherId },
            order: { createdAt: 'ASC' },
        });
    };
    sendResultNotifications = (sheet) => {
        return this.studentResultRepo
            .find({ where: { resultSheetId: sheet.id } })
            .then((results) => {
            const studentIds = results.map((r) => r.studentId);
            return this.studentParentRepo
                .find({ where: studentIds.map((sid) => ({ studentId: sid })) })
                .then((parentLinks) => {
                const parentIds = [
                    ...new Set(parentLinks.map((pl) => pl.parentId)),
                ];
                return this.userRepo
                    .find({ where: parentIds.map((pid) => ({ id: pid })) })
                    .then((parents) => {
                    const tokens = parents
                        .map((p) => p.expoPushToken)
                        .filter((token) => !!token);
                    return tokens.length > 0
                        ? this.notificationsService.sendBulkNotifications(tokens, 'Results Published', "Your child's results have been published. Check the app to view.")
                        : Promise.resolve();
                });
            });
        });
    };
    sendReturnNotification = (sheet, reason) => {
        return this.classRepo
            .findOne({
            where: { id: sheet.classId },
            relations: ['classTeacher'],
        })
            .then((classEntity) => {
            if (!classEntity?.classTeacher?.expoPushToken)
                return Promise.resolve();
            return this.notificationsService.sendPushNotification(classEntity.classTeacher.expoPushToken, 'Result Sheet Returned', `Your result sheet has been returned. Reason: ${reason}`);
        });
    };
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(result_sheet_entity_1.ResultSheet)),
    __param(1, (0, typeorm_1.InjectRepository)(student_result_entity_1.StudentResult)),
    __param(2, (0, typeorm_1.InjectRepository)(subject_score_entity_1.SubjectScore)),
    __param(3, (0, typeorm_1.InjectRepository)(class_entity_1.ClassEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(class_subject_entity_1.ClassSubject)),
    __param(5, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(6, (0, typeorm_1.InjectRepository)(student_parent_entity_1.StudentParent)),
    __param(7, (0, typeorm_1.InjectRepository)(term_entity_1.Term)),
    __param(8, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], ResultsService);
//# sourceMappingURL=results.service.js.map