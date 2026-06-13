import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Term } from '../terms/entities/term.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
import { UserRole, ResultStatus } from '../common/enums';
import { calculateGrade } from './utils/grading.util';

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
  ) => {
    const totalMaxPerSubject = (scoreComponents || []).reduce(
      (sum, sc) => sum + sc.maxScore,
      0,
    );
    studentResults.forEach((sr) => {
      const subjectCount = sr.subjectScores?.length || 0;
      sr.percentage = this.computeStudentPercentage(
        sr.totalScore,
        subjectCount,
        totalMaxPerSubject,
      );
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

  private processScores = (
    input: SaveSubjectScoresInput,
    sheet: ResultSheet,
    userId: string,
  ) => {
    return this.validateSubmitPayload(input, sheet).then(() => {
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
                      subjectId: input.subjectId,
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
                    subjectId: input.subjectId,
                    studentResultId: studentResult.id,
                  },
                })
                .then((subjectScore) => {
                  if (!subjectScore) {
                    return this.subjectScoreRepo.create({
                      resultSheetId: sheet.id,
                      subjectId: input.subjectId,
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
    });
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

      const updates = studentResults.map((sr) => {
        const subjectTotal = sr.subjectScores.reduce(
          (sum, ss) => sum + (ss.totalScore || 0),
          0,
        );
        sr.totalScore = subjectTotal;

        const subjectCount = sr.subjectScores.length || 1;
        const overallMaxScore = totalMaxScore * subjectCount;
        sr.grade = calculateGrade(
          subjectTotal,
          overallMaxScore,
          sheet.gradingSystem,
        );
        return sr;
      });

      return this.studentResultRepo.save(updates);
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

        const totalMaxScore = sheet.scoreComponents.reduce(
          (sum, sc) => sum + sc.maxScore,
          0,
        );

        return this.studentResultRepo
          .find({
            where: { resultSheetId },
            relations: ['subjectScores'],
          })
          .then((studentResults) => {
            studentResults.forEach((sr) => {
              const subjectTotal = sr.subjectScores.reduce(
                (sum, ss) => sum + (ss.totalScore || 0),
                0,
              );
              sr.totalScore = subjectTotal;

              const subjectCount = sr.subjectScores.length || 1;
              const overallMaxScore = totalMaxScore * subjectCount;
              sr.grade = calculateGrade(
                subjectTotal,
                overallMaxScore,
                sheet.gradingSystem,
              );
            });

            studentResults.sort(
              (a, b) => (b.totalScore || 0) - (a.totalScore || 0),
            );

            let currentPosition = 1;
            studentResults.forEach((sr, index) => {
              if (
                index > 0 &&
                sr.totalScore === studentResults[index - 1].totalScore
              ) {
                sr.position = studentResults[index - 1].position;
              } else {
                sr.position = currentPosition;
              }
              currentPosition = index + 2;
            });

            return this.studentResultRepo.save(studentResults);
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
      const where: { schoolId: string; status?: ResultStatus } = { schoolId };
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

    const where: any = { schoolId };
    if (status) where.status = status;
    where.classId = In(Array.from(classIds));

    return this.resultSheetRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  };

  getStudentResult = (studentId: string, termId: string, schoolId: string) => {
    return this.studentResultRepo
      .createQueryBuilder('sr')
      .innerJoinAndSelect('sr.resultSheet', 'rs')
      .leftJoinAndSelect('sr.subjectScores', 'ss')
      .where('sr.studentId = :studentId', { studentId })
      .andWhere('rs.termId = :termId', { termId })
      .andWhere('sr.schoolId = :schoolId', { schoolId })
      .getOne()
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        return this.resultSheetRepo
          .findOne({ where: { id: result.resultSheetId, schoolId } })
          .then((sheet) => {
            if (sheet) {
              this.applyComputedMetrics(sheet.scoreComponents || [], [result]);
            }
            return result;
          });
      });
  };

  getMySubjectScores = (teacherId: string, resultSheetId: string) => {
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
}
