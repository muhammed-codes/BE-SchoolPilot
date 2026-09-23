import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  FindOptionsWhere,
  LessThan,
} from 'typeorm';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import {
  ResultAnalytics,
  GradeDistributionItem,
} from './dto/result-analytics.type';
import {
  PaginatedClassScores,
  StudentScoreRecord,
} from './dto/paginated-class-scores.type';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Term } from '../terms/entities/term.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
import {
  UserRole,
  ResultStatus,
  TermStatus,
  GradingSystem,
} from '../common/enums';
import { calculateGrade } from './utils/grading.util';
import { createMetricStat } from '../common/dto/metric-stat.type';
import { ResultStats } from './dto/result-stats.type';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(ResultSheet)
    private readonly resultSheetRepo: Repository<ResultSheet>,
    @InjectRepository(StudentResult)
    private readonly studentResultRepo: Repository<StudentResult>,
    @InjectRepository(SubjectScore)
    private readonly subjectScoreRepo: Repository<SubjectScore>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectRepo: Repository<ClassSubject>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private computeStudentPercentage = (
    totalScore: number | null | undefined,
    subjectCount: number,
    totalMaxPerSubject: number,
  ) => {
    if (!subjectCount || totalMaxPerSubject <= 0) return undefined;
    const obtained = totalScore || 0;
    const obtainable = totalMaxPerSubject * subjectCount;
    if (obtainable <= 0) return undefined;
    return Number(((obtained / obtainable) * 100).toFixed(2));
  };

  private applyComputedMetrics = (
    scoreComponents: { maxScore: number }[],
    studentResults: StudentResult[],
    gradingSystem?: GradingSystem,
  ) => {
    const totalMaxPerSubject = (scoreComponents || []).reduce(
      (sum, sc) => sum + sc.maxScore,
      0,
    );
    studentResults.forEach((sr) => {
      let subjectTotalSum = 0;
      if (sr.subjectScores) {
        sr.subjectScores.forEach((ss) => {
          if (
            ss.totalScore !== null &&
            ss.totalScore !== undefined &&
            totalMaxPerSubject > 0 &&
            gradingSystem
          ) {
            ss.grade = calculateGrade(
              ss.totalScore,
              totalMaxPerSubject,
              gradingSystem,
            );
          }
          subjectTotalSum += ss.totalScore || 0;
        });
      }
      const subjectCount = sr.subjectScores?.length || 0;
      const effectiveTotal =
        sr.totalScore !== null && sr.totalScore !== undefined
          ? sr.totalScore
          : subjectTotalSum;
      sr.percentage = this.computeStudentPercentage(
        effectiveTotal,
        subjectCount,
        totalMaxPerSubject,
      );
      if (
        gradingSystem &&
        totalMaxPerSubject > 0 &&
        subjectCount > 0 &&
        effectiveTotal !== null &&
        effectiveTotal !== undefined
      ) {
        sr.grade = calculateGrade(
          effectiveTotal,
          totalMaxPerSubject * subjectCount,
          gradingSystem,
        );
      }
    });
    return studentResults;
  };

  createResultSheet = (
    input: CreateResultSheetInput,
    userId: string,
    schoolId: string,
  ) => {
    return Promise.all([
      this.classRepo.findOne({
        where: { id: input.classId, schoolId },
      }),
      this.termRepo.findOne({
        where: { id: input.termId, schoolId },
      }),
    ]).then(([classEntity, term]) => {
      if (!classEntity)
        throw new NotFoundException('Class not found in this school');
      if (!term) throw new NotFoundException('Term not found in this school');

      return this.dataSource.transaction((manager) => {
        const sheet = manager.create(ResultSheet, {
          classId: input.classId,
          termId: input.termId,
          schoolId,
          gradingSystem: input.gradingSystem,
          scoreComponents: input.scoreComponents,
          status: ResultStatus.DRAFT,
        });

        return manager.save(ResultSheet, sheet).then((savedSheet) =>
          this.studentRepo
            .find({
              where: {
                currentClassId: input.classId,
                schoolId,
                isArchived: false,
              },
            })
            .then((students) => {
              const studentResults = students.map((student) =>
                manager.create(StudentResult, {
                  resultSheetId: savedSheet.id,
                  studentId: student.id,
                  schoolId,
                }),
              );

              return manager
                .save(StudentResult, studentResults)
                .then((savedResults) =>
                  this.classSubjectRepo
                    .find({ where: { classId: input.classId } })
                    .then((classSubjects) => {
                      const subjectScores: Partial<SubjectScore>[] = [];
                      savedResults.forEach((sr) => {
                        classSubjects.forEach((cs) => {
                          subjectScores.push(
                            manager.create(SubjectScore, {
                              studentResultId: sr.id,
                              subjectId: cs.subjectId,
                              resultSheetId: savedSheet.id,
                              enteredByUserId: userId,
                              isSubmitted: false,
                            }),
                          );
                        });
                      });

                      return manager
                        .save(SubjectScore, subjectScores)
                        .then(() =>
                          manager
                            .findOne(ResultSheet, {
                              where: { id: savedSheet.id, schoolId },
                              relations: [
                                'studentResults',
                                'studentResults.subjectScores',
                                'studentResults.student',
                              ],
                            })
                            .then((sheet) => {
                              if (!sheet)
                                throw new NotFoundException(
                                  'Result sheet not found',
                                );
                              return sheet;
                            }),
                        );
                    }),
                );
            }),
        );
      });
    });
  };

  saveSubjectScores = async (
    input: SaveSubjectScoresInput,
    teacherId: string,
    schoolId: string,
  ) => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { id: input.resultSheetId, schoolId },
      relations: ['classEntity'],
    });

    if (!sheet) throw new NotFoundException('Result sheet not found');

    const isClassTeacher = sheet.classEntity.classTeacherId === teacherId;

    if (!isClassTeacher) {
      const classSubject = await this.classSubjectRepo.findOne({
        where: {
          classId: sheet.classId,
          subjectId: input.subjectId,
          subjectTeacherId: teacherId,
        },
      });

      if (!classSubject) {
        throw new ForbiddenException(
          'You are not assigned to teach this subject in this class',
        );
      }
    }

    return this.processScores(input, sheet, teacherId);
  };

  saveAdminScores = (
    input: SaveSubjectScoresInput,
    adminId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: input.resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');
        return this.processScores(input, sheet, adminId);
      });
  };

  private resolveSubjectId = async (
    subjectId: string | undefined,
    classId: string,
  ): Promise<string> => {
    const isUuid =
      typeof subjectId === 'string' &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        subjectId,
      );
    if (isUuid) return subjectId;

    const classSub = await this.classSubjectRepo.findOne({
      where: { classId },
    });
    if (classSub?.subjectId) return classSub.subjectId;

    const anyClassSub = await this.classSubjectRepo.findOne({});
    if (anyClassSub?.subjectId) return anyClassSub.subjectId;

    return '00000000-0000-0000-0000-000000000000';
  };

  private processScores = async (
    input: SaveSubjectScoresInput,
    sheet: ResultSheet,
    userId: string,
  ) => {
    const effectiveSubjectId = await this.resolveSubjectId(
      input.subjectId,
      sheet.classId,
    );
    await this.validateSubmitPayload(input, sheet);

    const maxScoreMap = new Map(
      sheet.scoreComponents.map((sc) => [sc.component, sc.maxScore]),
    );

    input.scores.forEach((studentScore) => {
      studentScore.componentScores.forEach((cs) => {
        const maxScore = maxScoreMap.get(cs.component);
        if (maxScore === undefined)
          throw new BadRequestException(
            `Score component ${cs.component} is not configured on this sheet`,
          );
        if (cs.score > maxScore)
          throw new BadRequestException(
            `Score ${cs.score} exceeds max ${maxScore} for component ${cs.component}`,
          );
      });
    });

    const totalMaxScore = sheet.scoreComponents.reduce(
      (sum, sc) => sum + sc.maxScore,
      0,
    );

    return Promise.all(
      input.scores.map((studentScore) =>
        this.studentResultRepo
          .findOne({
            where: {
              resultSheetId: sheet.id,
              studentId: studentScore.studentId,
            },
          })
          .then((studentResult) => {
            if (!studentResult) {
              const newStudentResult = this.studentResultRepo.create({
                resultSheetId: sheet.id,
                studentId: studentScore.studentId,
                schoolId: sheet.schoolId,
              });
              return this.studentResultRepo
                .save(newStudentResult)
                .then((savedSr) => {
                  return this.subjectScoreRepo.create({
                    resultSheetId: sheet.id,
                    subjectId: effectiveSubjectId,
                    studentResultId: savedSr.id,
                    enteredByUserId: userId,
                    isSubmitted: false,
                  });
                });
            }
            return this.subjectScoreRepo
              .findOne({
                where: {
                  resultSheetId: sheet.id,
                  subjectId: effectiveSubjectId,
                  studentResultId: studentResult.id,
                },
              })
              .then((subjectScore) => {
                if (!subjectScore) {
                  return this.subjectScoreRepo.create({
                    resultSheetId: sheet.id,
                    subjectId: effectiveSubjectId,
                    studentResultId: studentResult.id,
                    enteredByUserId: userId,
                    isSubmitted: false,
                  });
                }
                return subjectScore;
              });
          })
          .then((subjectScore) => {
            const totalScore = studentScore.componentScores.reduce(
              (sum, cs) => sum + cs.score,
              0,
            );

            subjectScore.scores = studentScore.componentScores;
            subjectScore.totalScore = totalScore;
            subjectScore.grade = calculateGrade(
              totalScore,
              totalMaxScore,
              sheet.gradingSystem,
            );
            subjectScore.enteredByUserId = userId;

            if (input.submit) {
              subjectScore.isSubmitted = true;
              subjectScore.submittedAt = new Date();
            }

            return this.subjectScoreRepo.save(subjectScore);
          }),
      ),
    ).then((savedScores) =>
      input.submit
        ? this.checkAndAdvanceStatus(sheet.id)
            .then(() => this.recalculateStudentTotals(sheet.id))
            .then(() => savedScores)
        : this.recalculateStudentTotals(sheet.id).then(() => savedScores),
    );
  };

  private validateSubmitPayload = (
    input: SaveSubjectScoresInput,
    sheet: ResultSheet,
  ) => {
    if (!input.submit) return Promise.resolve();

    const scoredStudentIds = new Set(
      input.scores
        .filter(
          (studentScore) => (studentScore.componentScores || []).length > 0,
        )
        .map((studentScore) => studentScore.studentId),
    );

    return this.studentResultRepo
      .count({ where: { resultSheetId: sheet.id } })
      .then((totalStudents) => {
        const unscoredStudents = Math.max(
          totalStudents - scoredStudentIds.size,
          0,
        );
        if (unscoredStudents > 0) {
          const suffix = unscoredStudents === 1 ? '' : 's';
          throw new BadRequestException(
            `Cannot submit scores yet. ${unscoredStudents} student${suffix} still need at least one score.`,
          );
        }
      });
  };

  private recalculateStudentTotals = (resultSheetId: string) => {
    return Promise.all([
      this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
      this.studentResultRepo.find({
        where: { resultSheetId },
        relations: ['subjectScores'],
      }),
    ]).then(([sheet, studentResults]) => {
      if (!sheet) throw new NotFoundException('Result sheet not found');

      const totalMaxScore = sheet.scoreComponents.reduce(
        (sum, sc) => sum + sc.maxScore,
        0,
      );

      const subjectScoreUpdates: SubjectScore[] = [];

      const updates = studentResults.map((sr) => {
        const subjectTotal = sr.subjectScores.reduce((sum, ss) => {
          if (
            ss.totalScore !== null &&
            ss.totalScore !== undefined &&
            totalMaxScore > 0 &&
            sheet.gradingSystem
          ) {
            const newGrade = calculateGrade(
              ss.totalScore,
              totalMaxScore,
              sheet.gradingSystem,
            );
            if (ss.grade !== newGrade) {
              ss.grade = newGrade;
              subjectScoreUpdates.push(ss);
            }
          }
          return sum + (ss.totalScore || 0);
        }, 0);
        sr.totalScore = subjectTotal;

        const subjectCount = sr.subjectScores.length || 1;
        const overallMaxScore = totalMaxScore * subjectCount;
        if (totalMaxScore > 0 && sheet.gradingSystem) {
          sr.grade = calculateGrade(
            subjectTotal,
            overallMaxScore,
            sheet.gradingSystem,
          );
        }
        return sr;
      });

      return this.studentResultRepo.save(updates).then(async (savedUpdates) => {
        if (subjectScoreUpdates.length > 0) {
          await this.subjectScoreRepo.save(subjectScoreUpdates);
        }
        return savedUpdates;
      });
    });
  };

  checkAndAdvanceStatus = (resultSheetId: string) => {
    return Promise.all([
      this.subjectScoreRepo.count({ where: { resultSheetId } }),
      this.subjectScoreRepo.count({
        where: { resultSheetId, isSubmitted: true },
      }),
      this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
    ]).then(([total, submitted, sheet]) => {
      if (!sheet) throw new NotFoundException('Result sheet not found');

      const canAdvanceToScoresEntered =
        sheet.status === ResultStatus.DRAFT ||
        sheet.status === ResultStatus.RETURNED;

      if (total > 0 && total === submitted && canAdvanceToScoresEntered) {
        return this.resultSheetRepo
          .update(resultSheetId, { status: ResultStatus.SCORES_ENTERED })
          .then(() => this.calculatePositions(resultSheetId))
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      }
      return sheet;
    });
  };

  submitForAdminReview = (
    resultSheetId: string,
    adminId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');
        return this.resultSheetRepo
          .update(resultSheetId, {
            status: ResultStatus.PENDING_ADMIN_REVIEW,
          })
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      });
  };

  submitForPrincipalApproval = (
    resultSheetId: string,
    principalId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');
        return this.resultSheetRepo
          .update(resultSheetId, {
            status: ResultStatus.PENDING_PRINCIPAL_APPROVAL,
          })
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      });
  };

  approveResult = (
    resultSheetId: string,
    principalId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');

        return this.resultSheetRepo
          .update(resultSheetId, { status: ResultStatus.PUBLISHED })
          .then(() => this.calculatePositions(resultSheetId))
          .then(() => this.sendResultNotifications(sheet))
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      });
  };

  publishResultSheet = (
    resultSheetId: string,
    userId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');
        if (sheet.status !== ResultStatus.SCORES_ENTERED) {
          throw new BadRequestException(
            'Result sheet must have all scores submitted before publishing',
          );
        }
        return this.resultSheetRepo
          .update(resultSheetId, { status: ResultStatus.PUBLISHED })
          .then(() => this.calculatePositions(resultSheetId))
          .then(() => this.sendResultNotifications(sheet))
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      });
  };

  returnResult = (
    resultSheetId: string,
    returnedById: string,
    schoolId: string,
    reason: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId, schoolId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');

        return this.resultSheetRepo
          .update(resultSheetId, {
            status: ResultStatus.RETURNED,
            returnReason: reason,
          })
          .then(() => this.sendReturnNotification(sheet, reason))
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      });
  };

  calculatePositions = (resultSheetId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');

        const totalMaxPerSubject = sheet.scoreComponents.reduce(
          (sum, sc) => sum + sc.maxScore,
          0,
        );

        return this.studentResultRepo
          .find({
            where: { resultSheetId },
            relations: ['subjectScores'],
          })
          .then((studentResults) => {
            const subjectScoreUpdates: SubjectScore[] = [];
            studentResults.forEach((sr) => {
              const subjectTotal = sr.subjectScores.reduce((sum, ss) => {
                if (
                  ss.totalScore !== null &&
                  ss.totalScore !== undefined &&
                  totalMaxPerSubject > 0 &&
                  sheet.gradingSystem
                ) {
                  const newGrade = calculateGrade(
                    ss.totalScore,
                    totalMaxPerSubject,
                    sheet.gradingSystem,
                  );
                  if (ss.grade !== newGrade) {
                    ss.grade = newGrade;
                    subjectScoreUpdates.push(ss);
                  }
                }
                return sum + (ss.totalScore || 0);
              }, 0);
              sr.totalScore = subjectTotal;

              const subjectCount = sr.subjectScores.length || 1;
              const overallMaxScore = totalMaxPerSubject * subjectCount;
              if (totalMaxPerSubject > 0 && sheet.gradingSystem) {
                sr.grade = calculateGrade(
                  subjectTotal,
                  overallMaxScore,
                  sheet.gradingSystem,
                );
              }
              sr.percentage = this.computeStudentPercentage(
                subjectTotal,
                subjectCount,
                totalMaxPerSubject,
              );
            });

            studentResults.sort(
              (a, b) => (b.percentage ?? -1) - (a.percentage ?? -1),
            );

            studentResults.forEach((sr, index) => {
              if (
                index > 0 &&
                sr.percentage === studentResults[index - 1].percentage
              ) {
                sr.position = studentResults[index - 1].position;
              } else {
                sr.position = index + 1;
              }
            });

            return this.studentResultRepo
              .save(studentResults)
              .then(async (savedResults) => {
                if (subjectScoreUpdates.length > 0) {
                  await this.subjectScoreRepo.save(subjectScoreUpdates);
                }
                return savedResults;
              });
          });
      });
  };

  saveTeacherRemark = (
    subjectScoreId: string,
    remark: string,
    userId: string,
    schoolId: string,
  ) => {
    return this.subjectScoreRepo
      .findOne({ where: { id: subjectScoreId }, relations: ['studentResult'] })
      .then((score) => {
        if (!score || score.studentResult.schoolId !== schoolId) {
          throw new NotFoundException('Subject score not found');
        }
        score.teacherRemark = remark;
        return this.subjectScoreRepo.save(score);
      });
  };

  savePrincipalRemark = (
    studentResultId: string,
    remark: string,
    schoolId: string,
  ) => {
    return this.studentResultRepo
      .findOne({ where: { id: studentResultId, schoolId } })
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        result.principalRemark = remark;
        return this.studentResultRepo.save(result);
      });
  };

  saveClassTeacherRemark = (
    studentResultId: string,
    remark: string,
    userId: string,
    schoolId: string,
  ) => {
    return this.studentResultRepo
      .findOne({ where: { id: studentResultId, schoolId } })
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        result.classTeacherRemark = remark;
        return this.studentResultRepo.save(result);
      });
  };

  getResultSheet = async (
    id: string,
    schoolId: string,
    userId: string,
    role: UserRole,
  ) => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { id, schoolId },
      relations: [
        'classEntity',
        'classEntity.classSubjects',
        'classEntity.classSubjects.subject',
        'studentResults',
        'studentResults.subjectScores',
        'studentResults.subjectScores.subject',
        'studentResults.student',
      ],
    });

    if (!sheet) throw new NotFoundException('Result sheet not found');

    const isLeadership = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);

    if (!isLeadership) {
      const isClassTeacher = sheet.classEntity.classTeacherId === userId;

      if (!isClassTeacher && role === UserRole.SUBJECT_TEACHER) {
        // Filter classSubjects
        sheet.classEntity.classSubjects =
          sheet.classEntity.classSubjects.filter(
            (cs) => cs.subjectTeacherId === userId,
          );

        // Filter subjectScores
        const allowedSubjectIds = sheet.classEntity.classSubjects.map(
          (cs) => cs.subjectId,
        );

        sheet.studentResults.forEach((sr) => {
          sr.subjectScores = sr.subjectScores.filter((ss) =>
            allowedSubjectIds.includes(ss.subjectId),
          );
        });
      }
    }

    this.applyComputedMetrics(
      sheet.scoreComponents || [],
      sheet.studentResults || [],
      sheet.gradingSystem,
    );
    return sheet;
  };

  getResultSheetsByClass = (
    classId: string,
    termId: string,
    schoolId: string,
  ) => {
    return this.resultSheetRepo.find({
      where: { classId, termId, schoolId },
      relations: [
        'classEntity',
        'term',
        'studentResults',
        'studentResults.student',
        'studentResults.subjectScores',
      ],
      order: { createdAt: 'DESC' },
    });
  };

  getPendingApprovals = (schoolId: string) => {
    return this.resultSheetRepo.find({
      where: { schoolId, status: ResultStatus.PENDING_PRINCIPAL_APPROVAL },
      order: { createdAt: 'DESC' },
    });
  };

  getSchoolResultSheets = async (
    schoolId: string,
    userId: string,
    role: UserRole,
    status?: ResultStatus,
  ) => {
    const isLeadership = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);

    if (isLeadership) {
      const where: {
        schoolId: string;
        isArchived: boolean;
        status?: ResultStatus;
      } = {
        schoolId,
        isArchived: false,
      };
      if (status) where.status = status;
      return this.resultSheetRepo.find({
        where,
        relations: [
          'classEntity',
          'term',
          'studentResults',
          'studentResults.student',
          'studentResults.subjectScores',
        ],
        order: { createdAt: 'DESC' },
      });
    }

    const myClasses = await this.classRepo.find({
      where: [{ classTeacherId: userId, schoolId }],
    });

    const mySubjectClasses = await this.classSubjectRepo.find({
      where: { subjectTeacherId: userId },
    });

    const classIds = new Set([
      ...myClasses.map((c) => c.id),
      ...mySubjectClasses.map((c) => c.classId),
    ]);

    if (classIds.size === 0) {
      return [];
    }

    const where: FindOptionsWhere<ResultSheet> = {
      schoolId,
      isArchived: false,
    };
    if (status) where.status = status;
    where.classId = In(Array.from(classIds));

    return this.resultSheetRepo.find({
      where,
      relations: [
        'classEntity',
        'term',
        'studentResults',
        'studentResults.student',
        'studentResults.subjectScores',
      ],
      order: { createdAt: 'DESC' },
    });
  };

  getResultStats = async (
    schoolId: string,
    userId: string,
    role: UserRole,
  ): Promise<ResultStats> => {
    if (!schoolId) {
      return {
        totalSheets: createMetricStat(0, null, null, false),
        pendingSheets: createMetricStat(0, null, null, false),
        approvedSheets: createMetricStat(0, null, null, false),
      };
    }

    const activeTerm = await this.termRepo.findOne({
      where: { schoolId, status: TermStatus.ACTIVE },
    });
    const hasActiveTerm = !!activeTerm;

    const sheets = await this.getSchoolResultSheets(schoolId, userId, role);
    const totalSheets = sheets.length;
    const approvedSheets = sheets.filter(
      (s) => s.status === ResultStatus.PUBLISHED,
    ).length;
    const pendingSheets = totalSheets - approvedSheets;

    return {
      totalSheets: createMetricStat(totalSheets, null, null, hasActiveTerm),
      pendingSheets: createMetricStat(
        pendingSheets,
        totalSheets,
        null,
        hasActiveTerm,
      ),
      approvedSheets: createMetricStat(
        approvedSheets,
        totalSheets,
        null,
        hasActiveTerm,
      ),
    };
  };

  getStudentResult = (
    studentId: string,
    termId: string,
    schoolId: string,
    userId?: string,
    userRole?: UserRole,
  ) => {
    const parentCheck =
      userRole === UserRole.PARENT && userId
        ? this.studentParentRepo.findOne({
            where: { studentId, parentId: userId },
          })
        : Promise.resolve(true);

    return parentCheck.then((link) => {
      if (!link) {
        throw new ForbiddenException(
          'You do not have access to this student result',
        );
      }

      const qb = this.studentResultRepo
        .createQueryBuilder('sr')
        .innerJoinAndSelect('sr.resultSheet', 'rs')
        .leftJoinAndSelect('rs.term', 't')
        .leftJoinAndSelect('t.session', 'sess')
        .leftJoinAndSelect('sr.subjectScores', 'ss')
        .leftJoinAndSelect('ss.subject', 'sub')
        .where('sr.studentId = :studentId', { studentId })
        .andWhere('rs.termId = :termId', { termId })
        .andWhere('sr.schoolId = :schoolId', { schoolId });

      if (userRole === UserRole.PARENT) {
        qb.andWhere('rs.status = :publishedStatus', {
          publishedStatus: ResultStatus.PUBLISHED,
        });
      }

      return qb.getOne().then((result) => {
        if (!result) return null;
        return this.resultSheetRepo
          .findOne({ where: { id: result.resultSheetId, schoolId } })
          .then((sheet) => {
            if (sheet) {
              this.applyComputedMetrics(
                sheet.scoreComponents || [],
                [result],
                sheet.gradingSystem,
              );
            }
            return result;
          });
      });
    });
  };

  getMyChildResults = (
    studentId: string,
    parentUserId: string,
    schoolId: string,
  ) => {
    return this.studentParentRepo
      .findOne({ where: { studentId, parentId: parentUserId } })
      .then((link) => {
        if (!link) {
          throw new ForbiddenException(
            'You do not have access to this student result',
          );
        }

        return this.studentResultRepo
          .createQueryBuilder('sr')
          .innerJoinAndSelect('sr.resultSheet', 'rs')
          .leftJoinAndSelect('rs.term', 't')
          .leftJoinAndSelect('t.session', 'sess')
          .leftJoinAndSelect('sr.subjectScores', 'ss')
          .leftJoinAndSelect('ss.subject', 'sub')
          .where('sr.studentId = :studentId', { studentId })
          .andWhere('sr.schoolId = :schoolId', { schoolId })
          .andWhere('rs.status = :publishedStatus', {
            publishedStatus: ResultStatus.PUBLISHED,
          })
          .orderBy('t.startDate', 'DESC')
          .getMany()
          .then((results) => {
            for (const res of results) {
              if (res.resultSheet) {
                this.applyComputedMetrics(
                  res.resultSheet.scoreComponents || [],
                  [res],
                  res.resultSheet.gradingSystem,
                );
              }
            }
            return results;
          });
      });
  };

  getMySubjectScores = async (
    teacherId: string,
    resultSheetId: string,
    schoolId: string,
  ) => {
    const resultSheet = await this.resultSheetRepo.findOne({
      where: { id: resultSheetId, schoolId },
    });
    if (!resultSheet) throw new NotFoundException('Result sheet not found');

    return this.subjectScoreRepo.find({
      where: { resultSheetId, enteredByUserId: teacherId },
      order: { createdAt: 'ASC' },
    });
  };

  private sendResultNotifications = (sheet: ResultSheet) => {
    return this.studentResultRepo
      .find({ where: { resultSheetId: sheet.id } })
      .then((results) => {
        const studentIds = results.map((r) => r.studentId);
        if (studentIds.length === 0) return Promise.resolve();

        return this.studentParentRepo
          .find({ where: studentIds.map((sid) => ({ studentId: sid })) })
          .then((parentLinks) => {
            const parentIds = [
              ...new Set(parentLinks.map((pl) => pl.parentId)),
            ];
            if (parentIds.length === 0) return Promise.resolve();

            return this.userRepo
              .find({ where: parentIds.map((pid) => ({ id: pid })) })
              .then((parents) => {
                const tokens = parents
                  .map((p) => p.expoPushToken)
                  .filter((token): token is string => !!token);
                return tokens.length > 0
                  ? this.notificationsService.sendBulkNotifications(
                      tokens,
                      'Results Published',
                      "Your child's results have been published. Check the app to view.",
                    )
                  : Promise.resolve();
              });
          });
      });
  };

  private sendReturnNotification = (sheet: ResultSheet, reason: string) => {
    return this.classRepo
      .findOne({
        where: { id: sheet.classId },
        relations: ['classTeacher'],
      })
      .then((classEntity) => {
        if (!classEntity?.classTeacher?.expoPushToken) return Promise.resolve();

        return this.notificationsService.sendPushNotification(
          classEntity.classTeacher.expoPushToken,
          'Result Sheet Returned',
          `Your result sheet has been returned. Reason: ${reason}`,
        );
      });
  };

  archiveResultSheet = async (id: string, schoolId: string) => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { id, schoolId },
    });

    if (!sheet) throw new NotFoundException('Result sheet not found');

    sheet.isArchived = true;
    return this.resultSheetRepo.save(sheet);
  };

  unarchiveResultSheet = async (id: string, schoolId: string) => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { id, schoolId },
    });

    if (!sheet) throw new NotFoundException('Result sheet not found');

    sheet.isArchived = false;
    return this.resultSheetRepo.save(sheet);
  };

  getArchivedResultSheets = async (
    schoolId: string,
    userId: string,
    role: UserRole,
    status?: ResultStatus,
  ) => {
    const isLeadership = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);

    if (isLeadership) {
      const where: {
        schoolId: string;
        isArchived: boolean;
        status?: ResultStatus;
      } = {
        schoolId,
        isArchived: true,
      };
      if (status) where.status = status;
      return this.resultSheetRepo.find({
        where,
        order: { createdAt: 'DESC' },
      });
    }

    const myClasses = await this.classRepo.find({
      where: [{ classTeacherId: userId, schoolId }],
    });

    const mySubjectClasses = await this.classSubjectRepo.find({
      where: { subjectTeacherId: userId },
    });

    const classIds = new Set([
      ...myClasses.map((c) => c.id),
      ...mySubjectClasses.map((c) => c.classId),
    ]);

    if (classIds.size === 0) {
      return [];
    }

    const where: FindOptionsWhere<ResultSheet> = {
      schoolId,
      isArchived: true,
    };
    if (status) where.status = status;
    where.classId = In(Array.from(classIds));

    return this.resultSheetRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  };

  getResultAnalytics = async (
    classId: string,
    sessionId: string,
    termId: string,
    subjectId: string | undefined,
    schoolId: string,
  ): Promise<ResultAnalytics> => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { classId, termId, schoolId, isArchived: false },
    });

    const defaultAnalytics: ResultAnalytics = {
      classAverage: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0,
      assessedCount: 0,
      passedCount: 0,
      gradeDistribution: [],
      deltaPreviousTerm: null,
    };

    if (!sheet) {
      return defaultAnalytics;
    }

    const currentTerm = await this.termRepo.findOne({
      where: { id: termId, schoolId },
    });

    if (subjectId && subjectId !== 'ALL') {
      const scores = await this.subjectScoreRepo.find({
        where: { resultSheetId: sheet.id, subjectId },
      });

      const maxScore =
        (sheet.scoreComponents || []).reduce((s, c) => s + c.maxScore, 0) ||
        100;

      const validScores = scores.filter(
        (s) => typeof s.totalScore === 'number' && s.totalScore !== null,
      );

      if (validScores.length === 0) {
        return defaultAnalytics;
      }

      const assessedCount = validScores.length;
      const numericScores = validScores.map((s) => s.totalScore);
      const highestScore = Math.max(...numericScores);
      const lowestScore = Math.min(...numericScores);
      const sum = numericScores.reduce((a, b) => a + b, 0);
      const classAverage = Number((sum / assessedCount).toFixed(1));

      const passedCount = validScores.filter((s) => {
        const pct = (s.totalScore / maxScore) * 100;
        return pct >= 40 && s.grade !== 'F9' && s.grade !== 'F';
      }).length;

      const passRate = Number(((passedCount / assessedCount) * 100).toFixed(1));

      const gradeCounts = new Map<string, number>();
      validScores.forEach((s) => {
        const g = s.grade || 'N/A';
        gradeCounts.set(g, (gradeCounts.get(g) || 0) + 1);
      });

      const gradeDistribution: GradeDistributionItem[] = Array.from(
        gradeCounts.entries(),
      )
        .map(([grade, count]) => ({
          grade,
          count,
          percentage: Number(((count / assessedCount) * 100).toFixed(1)),
        }))
        .sort((a, b) => a.grade.localeCompare(b.grade));

      let deltaPreviousTerm: number | null = null;
      if (currentTerm?.startDate) {
        const prevTerm = await this.termRepo.findOne({
          where: {
            schoolId,
            startDate: LessThan(currentTerm.startDate),
          },
          order: { startDate: 'DESC' },
        });

        if (prevTerm) {
          const prevSheet = await this.resultSheetRepo.findOne({
            where: {
              classId,
              termId: prevTerm.id,
              schoolId,
              isArchived: false,
            },
          });
          if (prevSheet) {
            const prevScores = await this.subjectScoreRepo.find({
              where: { resultSheetId: prevSheet.id, subjectId },
            });
            const validPrev = prevScores.filter(
              (s) => typeof s.totalScore === 'number' && s.totalScore !== null,
            );
            if (validPrev.length > 0) {
              const prevAvg =
                validPrev.reduce((acc, s) => acc + s.totalScore, 0) /
                validPrev.length;
              deltaPreviousTerm = Number((classAverage - prevAvg).toFixed(1));
            }
          }
        }
      }

      return {
        classAverage,
        passRate,
        highestScore,
        lowestScore,
        assessedCount,
        passedCount,
        gradeDistribution,
        deltaPreviousTerm,
      };
    } else {
      const studentResults = await this.studentResultRepo.find({
        where: { resultSheetId: sheet.id },
        relations: ['subjectScores'],
      });

      const totalMaxPerSubject = (sheet.scoreComponents || []).reduce(
        (sum, sc) => sum + sc.maxScore,
        0,
      );

      const validResults = studentResults.filter(
        (sr) => typeof sr.totalScore === 'number' && sr.totalScore > 0,
      );

      if (validResults.length === 0) {
        return defaultAnalytics;
      }

      const assessedCount = validResults.length;
      const percentages = validResults.map((sr) => {
        if (typeof sr.percentage === 'number' && sr.percentage > 0) {
          return sr.percentage;
        }
        const subjectCount = sr.subjectScores?.length || 1;
        const overallMax = totalMaxPerSubject * subjectCount;
        return overallMax > 0
          ? (sr.totalScore / overallMax) * 100
          : sr.totalScore;
      });

      const highestScore = Number(Math.max(...percentages).toFixed(1));
      const lowestScore = Number(Math.min(...percentages).toFixed(1));
      const sum = percentages.reduce((a, b) => a + b, 0);
      const classAverage = Number((sum / assessedCount).toFixed(1));

      const passedCount = validResults.filter((sr) => {
        const pct = sr.percentage ?? 0;
        return pct >= 40 && sr.grade !== 'F9' && sr.grade !== 'F';
      }).length;

      const passRate = Number(((passedCount / assessedCount) * 100).toFixed(1));

      const gradeCounts = new Map<string, number>();
      validResults.forEach((sr) => {
        const g = sr.grade || 'N/A';
        gradeCounts.set(g, (gradeCounts.get(g) || 0) + 1);
      });

      const gradeDistribution: GradeDistributionItem[] = Array.from(
        gradeCounts.entries(),
      )
        .map(([grade, count]) => ({
          grade,
          count,
          percentage: Number(((count / assessedCount) * 100).toFixed(1)),
        }))
        .sort((a, b) => a.grade.localeCompare(b.grade));

      let deltaPreviousTerm: number | null = null;
      if (currentTerm?.startDate) {
        const prevTerm = await this.termRepo.findOne({
          where: {
            schoolId,
            startDate: LessThan(currentTerm.startDate),
          },
          order: { startDate: 'DESC' },
        });

        if (prevTerm) {
          const prevSheet = await this.resultSheetRepo.findOne({
            where: {
              classId,
              termId: prevTerm.id,
              schoolId,
              isArchived: false,
            },
          });
          if (prevSheet) {
            const prevResults = await this.studentResultRepo.find({
              where: { resultSheetId: prevSheet.id },
            });
            const validPrev = prevResults.filter(
              (sr) => typeof sr.totalScore === 'number' && sr.totalScore > 0,
            );
            if (validPrev.length > 0) {
              const prevAvg =
                validPrev.reduce(
                  (acc, sr) => acc + (sr.percentage ?? sr.totalScore),
                  0,
                ) / validPrev.length;
              deltaPreviousTerm = Number((classAverage - prevAvg).toFixed(1));
            }
          }
        }
      }

      return {
        classAverage,
        passRate,
        highestScore,
        lowestScore,
        assessedCount,
        passedCount,
        gradeDistribution,
        deltaPreviousTerm,
      };
    }
  };

  getClassScores = async (
    classId: string,
    termId: string,
    subjectId: string | undefined,
    search: string | undefined,
    skip = 0,
    take = 50,
    schoolId: string,
  ): Promise<PaginatedClassScores> => {
    const sheet = await this.resultSheetRepo.findOne({
      where: { classId, termId, schoolId, isArchived: false },
      relations: ['classEntity'],
    });

    if (!sheet) {
      return { items: [], total: 0, hasMore: false };
    }

    if (subjectId && subjectId !== 'ALL') {
      const qb = this.subjectScoreRepo
        .createQueryBuilder('ss')
        .leftJoinAndSelect('ss.studentResult', 'sr')
        .leftJoinAndSelect('sr.student', 'student')
        .leftJoinAndSelect('ss.subject', 'subject')
        .where('ss.resultSheetId = :resultSheetId', { resultSheetId: sheet.id })
        .andWhere('ss.subjectId = :subjectId', { subjectId });

      if (search && search.trim()) {
        const term = `%${search.trim().toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(student.firstName) LIKE :term OR LOWER(student.lastName) LIKE :term OR LOWER(student.admissionNumber) LIKE :term)',
          { term },
        );
      }

      qb.orderBy('student.lastName', 'ASC').addOrderBy(
        'student.firstName',
        'ASC',
      );

      const total = await qb.getCount();
      const scores = await qb.skip(skip).take(take).getMany();

      const items: StudentScoreRecord[] = scores.map((ss) => {
        let ca1: number | undefined;
        let ca2: number | undefined;
        let exam: number | undefined;

        (ss.scores || []).forEach((cs) => {
          const comp = cs.component.toUpperCase();
          if (comp.includes('CA1') || comp.includes('1ST CA')) ca1 = cs.score;
          if (comp.includes('CA2') || comp.includes('2ND CA')) ca2 = cs.score;
          if (comp.includes('EXAM')) exam = cs.score;
        });

        const totalScore = ss.totalScore ?? 0;
        let status = 'Fail';
        if (totalScore >= 75) status = 'Distinction';
        else if (totalScore >= 60) status = 'Credit';
        else if (totalScore >= 40) status = 'Pass';

        return {
          id: ss.id,
          studentId: ss.studentResult?.studentId || '',
          studentName:
            `${ss.studentResult?.student?.firstName || ''} ${ss.studentResult?.student?.lastName || ''}`.trim(),
          admissionNumber: ss.studentResult?.student?.admissionNumber,
          passportPhotoUrl: ss.studentResult?.student?.passportPhotoUrl,
          gender: ss.studentResult?.student?.gender,
          classId: sheet.classId,
          className: sheet.classEntity?.name || '',
          subjectId: ss.subjectId,
          subjectName: ss.subject?.name,
          componentScores: ss.scores,
          ca1,
          ca2,
          exam,
          totalScore,
          grade: ss.grade,
          status,
          position: ss.studentResult?.position,
          teacherRemark: ss.teacherRemark,
          resultSheetId: sheet.id,
          resultSheetStatus: sheet.status,
        };
      });

      return {
        items,
        total,
        hasMore: skip + items.length < total,
      };
    } else {
      const qb = this.studentResultRepo
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.student', 'student')
        .leftJoinAndSelect('sr.subjectScores', 'ss')
        .leftJoinAndSelect('ss.subject', 'subject')
        .where('sr.resultSheetId = :resultSheetId', {
          resultSheetId: sheet.id,
        });

      if (search && search.trim()) {
        const term = `%${search.trim().toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(student.firstName) LIKE :term OR LOWER(student.lastName) LIKE :term OR LOWER(student.admissionNumber) LIKE :term)',
          { term },
        );
      }

      qb.orderBy('sr.position', 'ASC', 'NULLS LAST').addOrderBy(
        'student.lastName',
        'ASC',
      );

      const total = await qb.getCount();
      const results = await qb.skip(skip).take(take).getMany();

      const items: StudentScoreRecord[] = results.map((sr) => {
        const totalScore = sr.totalScore ?? 0;
        const pct = sr.percentage ?? 0;
        let status = 'Fail';
        if (pct >= 75) status = 'Distinction';
        else if (pct >= 60) status = 'Credit';
        else if (pct >= 40) status = 'Pass';

        return {
          id: sr.id,
          studentId: sr.studentId,
          studentName:
            `${sr.student?.firstName || ''} ${sr.student?.lastName || ''}`.trim(),
          admissionNumber: sr.student?.admissionNumber,
          passportPhotoUrl: sr.student?.passportPhotoUrl,
          gender: sr.student?.gender,
          classId: sheet.classId,
          className: sheet.classEntity?.name || '',
          totalScore,
          grade: sr.grade,
          status,
          position: sr.position,
          teacherRemark: sr.classTeacherRemark,
          resultSheetId: sheet.id,
          resultSheetStatus: sheet.status,
        };
      });

      return {
        items,
        total,
        hasMore: skip + items.length < total,
      };
    }
  };
}
