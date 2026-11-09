import { ResultsService } from './results.service';

describe('ResultsService class broadsheet', () => {
  it('returns configured component names, order, and marks in a paginated student page', async () => {
    const rosterQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(31),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          studentId: 'student-1',
          student: { firstName: 'Amina', middleName: 'Zainab', lastName: 'Bello', admissionNumber: 'SR-1' },
          totalScore: 42,
          grade: 'B',
          subjectScores: [{
            subjectId: 'subject-1',
            scores: [{ component: 'Project Work', score: 12 }, { component: 'Final Paper', score: 30 }],
            totalScore: 42,
            grade: 'B',
          }],
        },
      ]),
    };
    const subjectConfigQuery = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      distinctOn: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{
        subjectId: 'subject-1',
        subject: { name: 'Science' },
        scoreComponents: [
          { component: 'Project Work', maxScore: 20 },
          { component: 'Final Paper', maxScore: 80 },
        ],
      }]),
    };
    const resultSheetRepo = { findOne: jest.fn().mockResolvedValue({
      id: 'sheet-1',
      scoreComponents: [
        { component: 'Project Work', maxScore: 20 },
        { component: 'Final Paper', maxScore: 80 },
      ],
    }) };
    const studentResultRepo = { createQueryBuilder: jest.fn().mockReturnValue(rosterQuery) };
    const subjectScoreRepo = { createQueryBuilder: jest.fn().mockReturnValue(subjectConfigQuery) };
    const classSubjectRepo = { find: jest.fn().mockResolvedValue([{
      subjectId: 'subject-1', subject: { name: 'Science' },
    }]) };
    const service = new ResultsService(
      resultSheetRepo as never,
      studentResultRepo as never,
      subjectScoreRepo as never,
      {} as never,
      classSubjectRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.getClassBroadsheet(
      'class-1', 'term-1', undefined, 2, 15, 'school-1',
    );

    expect(rosterQuery.skip).toHaveBeenCalledWith(15);
    expect(rosterQuery.take).toHaveBeenCalledWith(15);
    expect(result).toMatchObject({
      total: 31,
      page: 2,
      limit: 15,
      subjects: [{
        subjectId: 'subject-1',
        subjectName: 'Science',
        scoreComponents: [
          { component: 'Project Work', maxScore: 20 },
          { component: 'Final Paper', maxScore: 80 },
        ],
      }],
      items: [{
        studentName: 'Amina Zainab Bello',
        admissionNumber: 'SR-1',
        totalScore: 42,
        subjects: [{
          subjectName: 'Science',
          scores: [{ component: 'Project Work', score: 12 }, { component: 'Final Paper', score: 30 }],
        }],
      }],
    });
  });
});
