import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { ResultStatus } from '../common/enums';
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
                          this.getResultSheet(savedSheet.id, schoolId),
                        );
                    }),
                );
            }),
        );
      });
    });
  };

  saveSubjectScores = (input: SaveSubjectScoresInput, teacherId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: input.resultSheetId } })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');

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
              throw new ForbiddenException(
                'You are not assigned to teach this subject in this class',
              );

            return this.processScores(input, sheet, teacherId);
          });
      });
  };

  saveAdminScores = (input: SaveSubjectScoresInput, adminId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: input.resultSheetId } })
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
        this.subjectScoreRepo
          .findOne({
            where: {
              resultSheetId: sheet.id,
              subjectId: input.subjectId,
              studentResultId: this.dataSource
                .createQueryBuilder()
                .subQuery()
                .select('sr.id')
                .from(StudentResult, 'sr')
                .where('sr.resultSheetId = :sheetId', { sheetId: sheet.id })
                .andWhere('sr.studentId = :studentId', {
                  studentId: studentScore.studentId,
                })
                .getQuery() as any,
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
                    throw new NotFoundException(
                      `Student result not found for student ${studentScore.studentId}`,
                    );
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
              throw new NotFoundException(
                `Subject score entry not found for student ${studentScore.studentId}`,
              );

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
        ? this.checkAndAdvanceStatus(sheet.id).then(() => savedScores)
        : savedScores,
    );
  };

  checkAndAdvanceStatus = (resultSheetId: string) => {
    return Promise.all([
      this.subjectScoreRepo.count({ where: { resultSheetId } }),
      this.subjectScoreRepo.count({
        where: { resultSheetId, isSubmitted: true },
      }),
    ]).then(([total, submitted]) => {
      if (total > 0 && total === submitted) {
        return this.resultSheetRepo
          .update(resultSheetId, { status: ResultStatus.SCORES_ENTERED })
          .then(() =>
            this.resultSheetRepo.findOne({ where: { id: resultSheetId } }),
          );
      }
      return this.resultSheetRepo.findOne({ where: { id: resultSheetId } });
    });
  };

  submitForAdminReview = (resultSheetId: string, adminId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
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

  submitForPrincipalApproval = (resultSheetId: string, principalId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
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

  approveResult = (resultSheetId: string, principalId: string) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
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

  returnResult = (
    resultSheetId: string,
    returnedById: string,
    reason: string,
  ) => {
    return this.resultSheetRepo
      .findOne({ where: { id: resultSheetId } })
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

  saveTeacherRemark = (subjectScoreId: string, remark: string) => {
    return this.subjectScoreRepo
      .findOne({ where: { id: subjectScoreId } })
      .then((score) => {
        if (!score) throw new NotFoundException('Subject score not found');
        score.teacherRemark = remark;
        return this.subjectScoreRepo.save(score);
      });
  };

  savePrincipalRemark = (studentResultId: string, remark: string) => {
    return this.studentResultRepo
      .findOne({ where: { id: studentResultId } })
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        result.principalRemark = remark;
        return this.studentResultRepo.save(result);
      });
  };

  saveClassTeacherRemark = (studentResultId: string, remark: string) => {
    return this.studentResultRepo
      .findOne({ where: { id: studentResultId } })
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        result.classTeacherRemark = remark;
        return this.studentResultRepo.save(result);
      });
  };

  getResultSheet = (id: string, schoolId: string) => {
    return this.resultSheetRepo
      .findOne({
        where: { id, schoolId },
        relations: ['studentResults', 'studentResults.subjectScores'],
      })
      .then((sheet) => {
        if (!sheet) throw new NotFoundException('Result sheet not found');
        return sheet;
      });
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

  getStudentResult = (studentId: string, termId: string) => {
    return this.studentResultRepo
      .createQueryBuilder('sr')
      .innerJoinAndSelect('sr.resultSheet', 'rs')
      .leftJoinAndSelect('sr.subjectScores', 'ss')
      .where('sr.studentId = :studentId', { studentId })
      .andWhere('rs.termId = :termId', { termId })
      .getOne()
      .then((result) => {
        if (!result) throw new NotFoundException('Student result not found');
        return result;
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
