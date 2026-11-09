import { ArrayContains } from 'typeorm';
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
import { ComponentScore } from './dto/component-score.type';
import { TeacherScoringAssignment } from './dto/teacher-scoring-assignment.type';
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
import {
  ClassBroadsheetPage,
  ClassBroadsheetSubject,
  ClassBroadsheetStudent,
} from './dto/class-broadsheet.type';
import { TEACHER_ROLES } from '../common/constants/roles.constant';

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

  private getTeacherResultClassIds = async (
    userId: string,
    role: UserRole,
    schoolId: string,
  ) => {
    if (role === UserRole.CLASS_TEACHER) {
      const classes = await this.classRepo.find({
        where: { classTeacherId: userId, schoolId },
        select: ['id'],
      });
      return classes.map((classEntity) => classEntity.id);
    }
    if (role === UserRole.SUBJECT_TEACHER) {
      const assignments = await this.classSubjectRepo.find({
        where: [
          { subjectTeacherId: userId, schoolId },
          { teacherIds: ArrayContains([userId]), schoolId },
        ],
        select: ['classId'],
      });
      return [...new Set(assignments.map((assignment) => assignment.classId))];
    }
    return undefined;
  };

  private getTeacherSubjectAssignments = async (
    userId: string,
    schoolId: string,
    classIds?: string[],
  ) => {
    const assignments = await this.classSubjectRepo.find({
      where: [
        {
          schoolId,
          subjectTeacherId: userId,
          ...(classIds ? { classId: In(classIds) } : {}),
        },
        {
          schoolId,
          teacherIds: ArrayContains([userId]),
          ...(classIds ? { classId: In(classIds) } : {}),
        },
      ],
      select: ['subjectId', 'classId'],
    });
    return assignments;
  };

  private applyComputedMetrics = (
    scoreComponents: { maxScore: number }[],
    studentResults: StudentResult[],
    gradingSystem?: GradingSystem,
  ) => {
    const fallbackComponents = scoreComponents || [];
    studentResults.forEach((sr) => {
      let subjectTotalSum = 0;
      let overallMaximum = 0;
      if (sr.subjectScores) {
        sr.subjectScores.forEach((ss) => {
          const subjectMaximum = (ss.scoreComponents?.length
            ? ss.scoreComponents
            : fallbackComponents
          ).reduce((sum, component) => sum + component.maxScore, 0);
          overallMaximum += subjectMaximum;
          if (
            ss.totalScore !== null &&
            ss.totalScore !== undefined &&
            subjectMaximum > 0 &&
            gradingSystem
          ) {
            ss.grade = calculateGrade(
              ss.totalScore,
              subjectMaximum,
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
        1,
        overallMaximum,
      );
      if (
        gradingSystem &&
        overallMaximum > 0 &&
        subjectCount > 0 &&
        effectiveTotal !== null &&
        effectiveTotal !== undefined
      ) {
        sr.grade = calculateGrade(
          effectiveTotal,
          overallMaximum,
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
    const componentNames = (input.scoreComponents || []).map((component) =>
      component.component.trim().toLocaleLowerCase(),
    );
    if (
      componentNames.some((name) => !name) ||
      new Set(componentNames).size !== componentNames.length ||
      input.scoreComponents.some(
        (component) =>
          !Number.isFinite(component.maxScore) || component.maxScore < 1,
      )
    ) {
      throw new BadRequestException(
        'Assessment components must have unique names and positive maximum marks',
      );
    }
    for (const subjectConfig of input.subjectScoreComponents || []) {
      const names = subjectConfig.scoreComponents.map((component) =>
        component.component.trim().toLocaleLowerCase(),
      );
      if (
        names.some((name) => !name) ||
        new Set(names).size !== names.length ||
        subjectConfig.scoreComponents.some(
          (component) =>
            !Number.isFinite(component.maxScore) || component.maxScore < 1,
        )
      ) {
        throw new BadRequestException(
          'Each subject needs unique assessment names and positive maximum marks',
        );
      }
    }
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
          createdByUserId: userId,
          gradingSystem: input.gradingSystem,
          scoreComponents: input.scoreComponents.map((component) => ({
            ...component,
            component: component.component.trim(),
          })),
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
                      const subjectComponentConfigs = new Map(
                        (input.subjectScoreComponents || []).map((entry) => [
                          entry.subjectId,
                          entry.scoreComponents.map((component) => ({
                            ...component,
                            component: component.component.trim(),
                          })),
                        ]),
                      );
                      const classSubjectIds = new Set(
                        classSubjects.map((classSubject) => classSubject.subjectId),
                      );
                      if (
                        [...subjectComponentConfigs.keys()].some(
                          (subjectId) => !classSubjectIds.has(subjectId),
                        )
                      ) {
                        throw new BadRequestException(
                          'Assessment configuration includes a subject outside this class',
                        );
                      }
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
                              scoreComponents:
                                subjectComponentConfigs.get(cs.subjectId) ||
                                input.scoreComponents.map((component) => ({
                                  ...component,
                                  component: component.component.trim(),
                                })),
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
    this.assertSheetIsEditable(sheet);

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
        this.assertSheetIsEditable(sheet);
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
    this.assertSheetIsEditable(sheet);
    const effectiveSubjectId = await this.resolveSubjectId(
      input.subjectId,
      sheet.classId,
    );
    await this.validateSubmitPayload(input, sheet);

    const configuredSubjectScore = await this.subjectScoreRepo.findOne({
      where: { resultSheetId: sheet.id, subjectId: effectiveSubjectId },
    });
    const subjectScoreComponents =
      configuredSubjectScore?.scoreComponents?.length
        ? configuredSubjectScore.scoreComponents
        : sheet.scoreComponents;
    const maxScoreMap = new Map(
      subjectScoreComponents.map((component) => [
        component.component,
        component.maxScore,
      ]),
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
        if (!Number.isFinite(cs.score) || cs.score < 0)
          throw new BadRequestException(
            `Score for ${cs.component} must be a valid non-negative number`,
          );
      });
    });

    const totalMaxScore = subjectScoreComponents.reduce(
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
            subjectScore.scoreComponents = subjectScoreComponents;
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

  private assertSheetIsEditable = (sheet: ResultSheet) => {
    if (sheet.status === ResultStatus.PUBLISHED) {
      throw new BadRequestException('Approved results cannot be edited');
    }
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

      const subjectScoreUpdates: SubjectScore[] = [];

      const updates = studentResults.map((sr) => {
        const subjectMaximums = new Map(
          sr.subjectScores.map((ss) => [
            ss.id,
            (ss.scoreComponents?.length
              ? ss.scoreComponents
              : sheet.scoreComponents
            ).reduce((sum, component) => sum + component.maxScore, 0),
          ]),
        );
        const subjectTotal = sr.subjectScores.reduce((sum, ss) => {
          const subjectMaximum = subjectMaximums.get(ss.id) || 0;
          if (
            ss.totalScore !== null &&
            ss.totalScore !== undefined &&
            subjectMaximum > 0 &&
            sheet.gradingSystem
          ) {
            const newGrade = calculateGrade(
              ss.totalScore,
              subjectMaximum,
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

        const overallMaxScore = [...subjectMaximums.values()].reduce(
          (sum, maximum) => sum + maximum,
          0,
        );
        if (overallMaxScore > 0 && sheet.gradingSystem) {
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
        this.assertSheetIsEditable(sheet);
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
        this.assertSheetIsEditable(sheet);
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
        if (sheet.status === ResultStatus.PUBLISHED) {
          throw new BadRequestException(
            'Result sheet has already been approved',
          );
        }

        return this.resultSheetRepo
          .update(resultSheetId, {
            status: ResultStatus.PUBLISHED,
            approvedByUserId: principalId,
            approvedAt: new Date(),
          })
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
          .update(resultSheetId, {
            status: ResultStatus.PUBLISHED,
            approvedByUserId: userId,
            approvedAt: new Date(),
          })
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
        this.assertSheetIsEditable(sheet);

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

        return this.studentResultRepo
          .find({
            where: { resultSheetId },
            relations: ['subjectScores'],
          })
          .then((studentResults) => {
            const subjectScoreUpdates: SubjectScore[] = [];
            studentResults.forEach((sr) => {
              const subjectMaximums = new Map(
                sr.subjectScores.map((ss) => [
                  ss.id,
                  (ss.scoreComponents?.length
                    ? ss.scoreComponents
                    : sheet.scoreComponents
                  ).reduce((sum, component) => sum + component.maxScore, 0),
                ]),
              );
              const subjectTotal = sr.subjectScores.reduce((sum, ss) => {
                const subjectMaximum = subjectMaximums.get(ss.id) || 0;
                if (
                  ss.totalScore !== null &&
                  ss.totalScore !== undefined &&
                  subjectMaximum > 0 &&
                  sheet.gradingSystem
                ) {
                  const newGrade = calculateGrade(
                    ss.totalScore,
                    subjectMaximum,
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

              const overallMaxScore = [...subjectMaximums.values()].reduce(
                (sum, maximum) => sum + maximum,
                0,
              );
              if (overallMaxScore > 0 && sheet.gradingSystem) {
                sr.grade = calculateGrade(
                  subjectTotal,
                  overallMaxScore,
                  sheet.gradingSystem,
                );
              }
              sr.percentage = this.computeStudentPercentage(
                subjectTotal,
                1,
                overallMaxScore,
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

  saveTeacherRemark = async (
    subjectScoreId: string,
    remark: string,
    userId: string,
    schoolId: string,
  ) => {
    const score = await this.subjectScoreRepo.findOne({
      where: { id: subjectScoreId },
      relations: ['studentResult'],
    });
    if (!score || score.studentResult.schoolId !== schoolId) {
      throw new NotFoundException('Subject score not found');
    }
    const sheet = await this.resultSheetRepo.findOne({
      where: { id: score.resultSheetId, schoolId },
    });
    if (sheet) this.assertSheetIsEditable(sheet);
    score.teacherRemark = remark;
    return this.subjectScoreRepo.save(score);
  };

  savePrincipalRemark = async (
    studentResultId: string,
    remark: string,
    schoolId: string,
  ) => {
    const result = await this.studentResultRepo.findOne({
      where: { id: studentResultId, schoolId },
    });
    if (!result) throw new NotFoundException('Student result not found');
    const sheet = await this.resultSheetRepo.findOne({
      where: { id: result.resultSheetId, schoolId },
    });
    if (sheet) this.assertSheetIsEditable(sheet);
    result.principalRemark = remark;
    return this.studentResultRepo.save(result);
  };

  saveClassTeacherRemark = async (
    studentResultId: string,
    remark: string,
    userId: string,
    schoolId: string,
  ) => {
    const result = await this.studentResultRepo.findOne({
      where: { id: studentResultId, schoolId },
    });
    if (!result) throw new NotFoundException('Student result not found');
    const sheet = await this.resultSheetRepo.findOne({
      where: { id: result.resultSheetId, schoolId },
    });
    if (sheet) this.assertSheetIsEditable(sheet);
    result.classTeacherRemark = remark;
    return this.studentResultRepo.save(result);
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
        'createdByUser',
        'approvedByUser',
        'studentResults',
        'studentResults.subjectScores',
        'studentResults.subjectScores.subject',
        'studentResults.subjectScores.enteredByUser',
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
      if (
        role === UserRole.CLASS_TEACHER &&
        sheet.classEntity.classTeacherId !== userId
      ) {
        throw new ForbiddenException('You do not have access to this result sheet');
      }

      if (role === UserRole.SUBJECT_TEACHER) {
        // Filter classSubjects
        sheet.classEntity.classSubjects =
          sheet.classEntity.classSubjects.filter(
            (cs) =>
              cs.subjectTeacherId === userId || cs.teacherIds?.includes(userId),
          );

        // Filter subjectScores
        const allowedSubjectIds = sheet.classEntity.classSubjects.map(
          (cs) => cs.subjectId,
        );
        if (allowedSubjectIds.length === 0) {
          throw new ForbiddenException('You do not have access to this result sheet');
        }

        sheet.studentResults.forEach((sr) => {
          sr.subjectScores = sr.subjectScores.filter((ss) =>
            allowedSubjectIds.includes(ss.subjectId),
          );
          sr.totalScore = sr.subjectScores.reduce(
            (sum, score) => sum + (score.totalScore || 0),
            0,
          );
          sr.position = null as unknown as number;
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

  getSchoolResultSheets = async (
    schoolId: string,
    userId: string,
    role: UserRole,
    status?: ResultStatus,
    termId?: string,
    classId?: string,
  ) => {
    const isLeadership = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);

    if (isLeadership) {
      const where: FindOptionsWhere<ResultSheet> = {
        schoolId,
        isArchived: false,
      };
      if (status) where.status = status;
      if (termId) where.termId = termId;
      if (classId) where.classId = classId;
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

    const myClasses =
      role === UserRole.CLASS_TEACHER
        ? await this.classRepo.find({
            where: [{ classTeacherId: userId, schoolId }],
          })
        : [];

    const mySubjectClasses =
      role === UserRole.SUBJECT_TEACHER
        ? await this.classSubjectRepo.find({
            where: [
              { schoolId, subjectTeacherId: userId },
              { schoolId, teacherIds: ArrayContains([userId]) },
            ],
          })
        : [];

    const classIds = new Set([
      ...myClasses.map((c) => c.id),
      ...mySubjectClasses.map((c) => c.classId),
    ]);

    if (classIds.size === 0) {
      return [];
    }

    if (classId && !classIds.has(classId)) {
      return [];
    }

    const where: FindOptionsWhere<ResultSheet> = {
      schoolId,
      isArchived: false,
    };
    if (status) where.status = status;
    if (termId) where.termId = termId;
    where.classId = classId ? classId : In(Array.from(classIds));

    return this.resultSheetRepo
      .find({
        where,
        relations: [
          'classEntity',
          'term',
          'studentResults',
          'studentResults.student',
          'studentResults.subjectScores',
        ],
        order: { createdAt: 'DESC' },
      })
      .then((sheets) =>
        Promise.all(
          sheets.map((sheet) =>
            this.getResultSheet(sheet.id, schoolId, userId, role),
          ),
        ),
      );
  };

  getMyScoringAssignments = async (
    schoolId: string,
    userId: string,
    role: UserRole,
    termId?: string,
  ): Promise<TeacherScoringAssignment[]> => {
    let targetTermId = termId;
    if (!targetTermId) {
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      if (activeTerm) {
        targetTermId = activeTerm.id;
      } else {
        const latestTerm = await this.termRepo.findOne({
          where: { schoolId },
          order: { createdAt: 'DESC' },
        });
        targetTermId = latestTerm?.id;
      }
    }

    if (!targetTermId) {
      return [];
    }

    const isLeadership = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
    ].includes(role);

    const allClasses = await this.classRepo.find({
      where: { schoolId },
      relations: ['classSubjects', 'classSubjects.subject'],
      order: { name: 'ASC' },
    });

    const sheets = await this.resultSheetRepo.find({
      where: { schoolId, termId: targetTermId, isArchived: false },
    });
    const sheetByClassId = new Map(sheets.map((s) => [s.classId, s]));

    const assignments: TeacherScoringAssignment[] = [];

    for (const cls of allClasses) {
      const isClassTeacher =
        role === UserRole.CLASS_TEACHER && cls.classTeacherId === userId;
      if (role === UserRole.CLASS_TEACHER && !isClassTeacher) continue;
      let relevantSubjects = cls.classSubjects || [];

      if (!isLeadership && !isClassTeacher) {
        relevantSubjects = relevantSubjects.filter(
          (cs) =>
            cs.subjectTeacherId === userId || cs.teacherIds?.includes(userId),
        );
        if (relevantSubjects.length === 0) {
          continue;
        }
      }

      const activeSheet = sheetByClassId.get(cls.id);
      const isSheetActive =
        activeSheet && activeSheet.status !== ResultStatus.PUBLISHED;

      assignments.push({
        classId: cls.id,
        className: cls.name,
        hasActiveSheet: Boolean(activeSheet && isSheetActive),
        activeSheetId: activeSheet?.id,
        sheetStatus: activeSheet?.status,
        subjects: relevantSubjects.map((cs) => ({
          id: cs.id,
          subjectId: cs.subjectId,
          subjectName: cs.subject?.name || `Subject ${cs.subjectId}`,
          subjectCode: cs.subject?.code,
        })),
      });
    }

    return assignments;
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

    return parentCheck.then(async (link) => {
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

      if (userId && userRole && TEACHER_ROLES.includes(userRole)) {
        const classIds = await this.getTeacherResultClassIds(
          userId,
          userRole,
          schoolId,
        );
        if (!classIds?.length) return null;
        qb.andWhere('rs.classId IN (:...classIds)', { classIds });
      }

      if (userRole === UserRole.PARENT) {
        qb.andWhere('rs.status = :publishedStatus', {
          publishedStatus: ResultStatus.PUBLISHED,
        });
      }

      return qb.getOne().then((result) => {
        if (!result) return null;
        if (userId && userRole === UserRole.SUBJECT_TEACHER) {
          return this.getTeacherSubjectAssignments(userId, schoolId, [result.resultSheet.classId])
            .then((assignments) => {
              const subjectIds = assignments.map((assignment) => assignment.subjectId);
              result.subjectScores = (result.subjectScores || []).filter((score) =>
                subjectIds.includes(score.subjectId),
              );
              return this.resultSheetRepo
                .findOne({ where: { id: result.resultSheetId, schoolId } })
                .then((sheet) => {
                  if (sheet) this.applyComputedMetrics(sheet.scoreComponents || [], [result], sheet.gradingSystem);
                  return result;
                });
            });
        }
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

  getStudentAcademicHistory = async (
    studentId: string,
    schoolId: string,
    userId: string,
    userRole: UserRole,
  ) => {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (userRole === UserRole.PARENT) {
      const link = await this.studentParentRepo.findOne({
        where: { studentId, parentId: userId },
      });
      if (!link) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    const query = this.studentResultRepo
      .createQueryBuilder('sr')
      .innerJoinAndSelect('sr.resultSheet', 'rs')
      .leftJoinAndSelect('rs.classEntity', 'classEntity')
      .leftJoinAndSelect('rs.term', 'term')
      .leftJoinAndSelect('term.session', 'session')
      .leftJoinAndSelect('sr.subjectScores', 'subjectScore')
      .leftJoinAndSelect('subjectScore.subject', 'subject')
      .where('sr.studentId = :studentId', { studentId })
      .andWhere('sr.schoolId = :schoolId', { schoolId })
      .andWhere('rs.schoolId = :schoolId', { schoolId });

    if (TEACHER_ROLES.includes(userRole)) {
      const classIds = await this.getTeacherResultClassIds(
        userId,
        userRole,
        schoolId,
      );
      if (!classIds?.length) return [];
      query.andWhere('rs.classId IN (:...classIds)', { classIds });
    }

    if (userRole === UserRole.PARENT) {
      query.andWhere('rs.status = :publishedStatus', {
        publishedStatus: ResultStatus.PUBLISHED,
      });
    }

    const results = await query
      .orderBy('term.startDate', 'DESC')
      .addOrderBy('classEntity.name', 'ASC')
      .getMany();

    if (userRole === UserRole.SUBJECT_TEACHER) {
      const assignments = await this.getTeacherSubjectAssignments(
        userId,
        schoolId,
        [...new Set(results.map((result) => result.resultSheet.classId))],
      );
      for (const result of results) {
        result.subjectScores = (result.subjectScores || []).filter((score) =>
          assignments.some((assignment) =>
            assignment.classId === result.resultSheet.classId &&
            assignment.subjectId === score.subjectId,
          ),
        );
      }
    }

    for (const result of results) {
      this.applyComputedMetrics(
        result.resultSheet.scoreComponents || [],
        [result],
        result.resultSheet.gradingSystem,
      );
    }
    return results;
  };

  getStudentResultBySheet = async (
    studentId: string,
    resultSheetId: string,
    schoolId: string,
    userId: string,
    userRole: UserRole,
  ) => {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (userRole === UserRole.PARENT) {
      const link = await this.studentParentRepo.findOne({
        where: { studentId, parentId: userId },
      });
      if (!link) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    const query = this.studentResultRepo
      .createQueryBuilder('sr')
      .innerJoinAndSelect('sr.resultSheet', 'rs')
      .leftJoinAndSelect('rs.classEntity', 'classEntity')
      .leftJoinAndSelect('rs.term', 'term')
      .leftJoinAndSelect('term.session', 'session')
      .leftJoinAndSelect('sr.student', 'student')
      .leftJoinAndSelect('sr.subjectScores', 'subjectScore')
      .leftJoinAndSelect('subjectScore.subject', 'subject')
      .where('sr.studentId = :studentId', { studentId })
      .andWhere('sr.resultSheetId = :resultSheetId', { resultSheetId })
      .andWhere('sr.schoolId = :schoolId', { schoolId })
      .andWhere('rs.schoolId = :schoolId', { schoolId });

    if (TEACHER_ROLES.includes(userRole)) {
      const classIds = await this.getTeacherResultClassIds(
        userId,
        userRole,
        schoolId,
      );
      if (!classIds?.length) {
        throw new ForbiddenException('You do not have access to this result');
      }
      query.andWhere('rs.classId IN (:...classIds)', { classIds });
    }

    if (userRole === UserRole.PARENT) {
      query.andWhere('rs.status = :publishedStatus', {
        publishedStatus: ResultStatus.PUBLISHED,
      });
    }

    const result = await query.getOne();
    if (result) {
      if (userRole === UserRole.SUBJECT_TEACHER) {
        const assignments = await this.getTeacherSubjectAssignments(
          userId,
          schoolId,
          [result.resultSheet.classId],
        );
        result.subjectScores = (result.subjectScores || []).filter((score) =>
          assignments.some((assignment) =>
            assignment.subjectId === score.subjectId,
          ),
        );
      }
      this.applyComputedMetrics(
        result.resultSheet.scoreComponents || [],
        [result],
        result.resultSheet.gradingSystem,
      );
    }
    return result;
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

    const myClasses =
      role === UserRole.CLASS_TEACHER
        ? await this.classRepo.find({
            where: [{ classTeacherId: userId, schoolId }],
          })
        : [];

    const mySubjectClasses =
      role === UserRole.SUBJECT_TEACHER
        ? await this.classSubjectRepo.find({
            where: [
              { schoolId, subjectTeacherId: userId },
              { schoolId, teacherIds: ArrayContains([userId]) },
            ],
          })
        : [];

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
        const maxScore = (s.scoreComponents?.length
          ? s.scoreComponents
          : sheet.scoreComponents || []
        ).reduce((sum, component) => sum + component.maxScore, 0);
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
        const overallMax = (sr.subjectScores || []).reduce(
          (maxTotal, subjectScore) => maxTotal + (subjectScore.scoreComponents?.length
            ? subjectScore.scoreComponents
            : sheet.scoreComponents || []
          ).reduce((max, component) => max + component.maxScore, 0),
          0,
        );
        return overallMax > 0
          ? (sr.totalScore / overallMax) * 100
          : sr.totalScore;
      });

      const highestScore = Number(Math.max(...percentages).toFixed(1));
      const lowestScore = Number(Math.min(...percentages).toFixed(1));
      const sum = percentages.reduce((a, b) => a + b, 0);
      const classAverage = Number((sum / assessedCount).toFixed(1));

      const passedCount = validResults.filter((sr, idx) => {
        const pct = percentages[idx];
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

    const singleSubjectMax =
      (sheet.scoreComponents || []).reduce(
        (sum, sc) => sum + (sc.maxScore || 0),
        0,
      ) || 100;

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
          const comp = (cs.component || '').toUpperCase();
          if (
            comp.includes('CA1') ||
            comp.includes('1ST CA') ||
            comp.includes('TEST 1') ||
            comp.includes('FIRST CA')
          )
            ca1 = cs.score;
          if (
            comp.includes('CA2') ||
            comp.includes('2ND CA') ||
            comp.includes('TEST 2') ||
            comp.includes('SECOND CA')
          )
            ca2 = cs.score;
          if (comp.includes('EXAM')) exam = cs.score;
        });

        const totalScore = ss.totalScore ?? 0;
        const subjectComponents = ss.scoreComponents?.length
          ? ss.scoreComponents
          : sheet.scoreComponents || [];
        const subjectMaximum = subjectComponents.reduce(
          (sum, component) => sum + component.maxScore,
          0,
        ) || singleSubjectMax;
        const pct =
          subjectMaximum > 0
            ? Math.round((totalScore / subjectMaximum) * 100 * 10) / 10
            : 0;

        let status = 'Fail';
        const gradeUpper = (ss.grade || '').toUpperCase();
        if (gradeUpper.startsWith('A') || pct >= 75) status = 'Distinction';
        else if (
          gradeUpper.startsWith('B') ||
          gradeUpper.startsWith('C') ||
          pct >= 50
        )
          status = 'Credit';
        else if (
          gradeUpper.startsWith('D') ||
          gradeUpper.startsWith('E') ||
          pct >= 40
        )
          status = 'Pass';
        else status = 'Fail';

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
          maxScore: subjectMaximum,
          percentage: pct,
          subjectCount: 1,
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
        scoreComponents: sheet.scoreComponents || [],
        maxScore: singleSubjectMax,
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

      this.applyComputedMetrics(
        sheet.scoreComponents || [],
        results,
        sheet.gradingSystem,
      );

      const items: StudentScoreRecord[] = results.map((sr) => {
        const totalScore = sr.totalScore ?? 0;
        const maxScore = (sr.subjectScores || []).reduce(
          (maximum, subjectScore) => maximum + (subjectScore.scoreComponents?.length
            ? subjectScore.scoreComponents
            : sheet.scoreComponents || []
          ).reduce((componentMaximum, component) => componentMaximum + component.maxScore, 0),
          0,
        );
        const pct =
          sr.percentage !== undefined && sr.percentage !== null
            ? Math.round(sr.percentage * 10) / 10
            : maxScore > 0
              ? Math.round((totalScore / maxScore) * 100 * 10) / 10
              : 0;

        let totalCa1 = 0;
        let totalCa2 = 0;
        let totalExam = 0;
        let hasCa1 = false;
        let hasCa2 = false;
        let hasExam = false;
        const componentTotalsMap = new Map<string, number>();

        (sr.subjectScores || []).forEach((ss) => {
          (ss.scores || []).forEach((cs) => {
            const comp = String(cs.component || '').toUpperCase();
            if (
              comp.includes('CA1') ||
              comp.includes('1ST CA') ||
              comp.includes('TEST 1') ||
              comp.includes('FIRST CA')
            ) {
              totalCa1 += cs.score || 0;
              hasCa1 = true;
            } else if (
              comp.includes('CA2') ||
              comp.includes('2ND CA') ||
              comp.includes('TEST 2') ||
              comp.includes('SECOND CA')
            ) {
              totalCa2 += cs.score || 0;
              hasCa2 = true;
            } else if (comp.includes('EXAM')) {
              totalExam += cs.score || 0;
              hasExam = true;
            }

            if (cs.component) {
              componentTotalsMap.set(
                cs.component,
                (componentTotalsMap.get(cs.component) || 0) + (cs.score || 0),
              );
            }
          });
        });

        const aggregatedComponentScores: ComponentScore[] = Array.from(
          componentTotalsMap.entries(),
        ).map(([component, score]) => ({
          component,
          score: Math.round(score * 10) / 10,
        }));

        let status = 'Fail';
        const gradeUpper = (sr.grade || '').toUpperCase();
        if (gradeUpper.startsWith('A') || pct >= 75) status = 'Distinction';
        else if (
          gradeUpper.startsWith('B') ||
          gradeUpper.startsWith('C') ||
          pct >= 50
        )
          status = 'Credit';
        else if (
          gradeUpper.startsWith('D') ||
          gradeUpper.startsWith('E') ||
          pct >= 40
        )
          status = 'Pass';
        else status = 'Fail';

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
          componentScores: aggregatedComponentScores,
          ca1: hasCa1 ? Math.round(totalCa1 * 10) / 10 : undefined,
          ca2: hasCa2 ? Math.round(totalCa2 * 10) / 10 : undefined,
          exam: hasExam ? Math.round(totalExam * 10) / 10 : undefined,
          totalScore,
          maxScore,
          percentage: pct,
          subjectCount: sr.subjectScores?.length || 0,
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
        scoreComponents: sheet.scoreComponents || [],
        maxScore: singleSubjectMax,
      };
    }
  };

  getClassBroadsheet = async (
    classId: string,
    termId: string,
    search: string | undefined,
    page = 1,
    limit = 25,
    schoolId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<ClassBroadsheetPage> => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    if (userId && userRole && TEACHER_ROLES.includes(userRole)) {
      const assignedClassIds = await this.getTeacherResultClassIds(
        userId,
        userRole,
        schoolId,
      );
      if (!assignedClassIds?.includes(classId)) {
        throw new ForbiddenException('You do not have access to this class result');
      }
    }
    const sheet = await this.resultSheetRepo.findOne({
      where: { classId, termId, schoolId, isArchived: false },
    });
    if (!sheet) {
      return {
        items: [], total: 0, page: safePage, limit: safeLimit,
        subjects: [],
      };
    }

    const rosterQuery = this.studentResultRepo
      .createQueryBuilder('sr')
      .innerJoin('sr.student', 'student')
      .where('sr.resultSheetId = :resultSheetId', { resultSheetId: sheet.id })
      .andWhere('sr.schoolId = :schoolId', { schoolId });
    if (search?.trim()) {
      rosterQuery.andWhere(
        '(LOWER(student.firstName) LIKE :search OR LOWER(student.middleName) LIKE :search OR LOWER(student.lastName) LIKE :search OR LOWER(student.admissionNumber) LIKE :search)',
        { search: `%${search.trim().toLowerCase()}%` },
      );
    }
    const total = await rosterQuery.getCount();
    const resultRows = await rosterQuery
      .leftJoinAndSelect('sr.student', 'studentDetails')
      .leftJoinAndSelect('sr.subjectScores', 'subjectScore')
      .leftJoinAndSelect('subjectScore.subject', 'subject')
      .orderBy('studentDetails.lastName', 'ASC')
      .addOrderBy('studentDetails.firstName', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getMany();
    const assignedSubjects =
      userRole === UserRole.SUBJECT_TEACHER && userId
        ? await this.getTeacherSubjectAssignments(userId, schoolId, [classId])
        : undefined;
    const assignedSubjectIds = assignedSubjects
      ? new Set(assignedSubjects.map((assignment) => assignment.subjectId))
      : undefined;
    const configuredSubjectScores = await this.subjectScoreRepo
      .createQueryBuilder('configuredScore')
      .leftJoinAndSelect('configuredScore.subject', 'configuredSubject')
      .where('configuredScore.resultSheetId = :resultSheetId', {
        resultSheetId: sheet.id,
      })
      .distinctOn(['configuredScore.subjectId'])
      .orderBy('configuredScore.subjectId', 'ASC')
      .getMany();
    const subjectConfigs: ClassBroadsheetSubject[] = configuredSubjectScores
      .filter((subjectScore) => !assignedSubjectIds || assignedSubjectIds.has(subjectScore.subjectId))
      .filter((subjectScore) => subjectScore.subject)
      .map((subjectScore) => ({
        subjectId: subjectScore.subjectId,
        subjectName: subjectScore.subject.name,
        scoreComponents: subjectScore.scoreComponents?.length
          ? subjectScore.scoreComponents
          : sheet.scoreComponents || [],
      }));
    const overallMaximum = subjectConfigs.reduce(
      (sum, subject) => sum + subject.scoreComponents.reduce(
        (componentSum, component) => componentSum + Number(component.maxScore || 0),
        0,
      ),
      0,
    );
    const items: ClassBroadsheetStudent[] = resultRows.map((result) => {
      const subjects = subjectConfigs.map((configuredSubject) => {
        const score = result.subjectScores?.find(
          (subjectScore) => subjectScore.subjectId === configuredSubject.subjectId,
        );
        return {
          subjectId: configuredSubject.subjectId,
          subjectName: configuredSubject.subjectName,
          scores: score?.scores || [],
          totalScore: score?.totalScore ?? undefined,
          grade: score?.grade || undefined,
        };
      });
      const enteredSubjectTotals = subjects
        .map((subject) => subject.totalScore)
        .filter((score): score is number => score !== undefined && score !== null);
      const totalScore = enteredSubjectTotals.length
        ? enteredSubjectTotals.reduce((sum, score) => sum + score, 0)
        : undefined;
      return {
        studentId: result.studentId,
        studentName: result.student
          ? [result.student.firstName, result.student.middleName, result.student.lastName]
              .filter(Boolean).join(' ')
          : '',
        admissionNumber: result.student?.admissionNumber,
        subjects,
        totalScore,
        maxScore: overallMaximum || undefined,
        grade:
          totalScore !== undefined && overallMaximum > 0
            ? calculateGrade(totalScore, overallMaximum, sheet.gradingSystem)
            : undefined,
      };
    });
    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      subjects: subjectConfigs,
    };
  };
}
