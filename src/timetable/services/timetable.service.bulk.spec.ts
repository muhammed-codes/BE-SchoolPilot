import { TimetableService } from './timetable.service';

describe('TimetableService bulk timetable operations', () => {
  function makeService(sourceEntries: any[]) {
    const service = Object.create(TimetableService.prototype) as any;
    service.entryRepo = {
      find: jest.fn().mockResolvedValue(sourceEntries),
      delete: jest.fn(),
    };
    service.createTimetableEntry = jest.fn(async (input: any) => ({
      success: input.periodId !== 'conflicting-period',
      entry: null,
      violations:
        input.periodId === 'conflicting-period'
          ? [{ severity: 'BLOCKING', message: `Conflict for ${input.classId}` }]
          : [],
    }));
    return service;
  }

  it('reports a conflicting copied slot without deleting the destination schedule', async () => {
    const service = makeService([
      { classId: 'class-a', subjectId: 'subject-a', teacherId: 'teacher-a', periodId: 'conflicting-period', isDoublePeriod: false },
      { classId: 'class-b', subjectId: 'subject-b', teacherId: 'teacher-b', periodId: 'available-period', isDoublePeriod: false },
    ]);

    const results = await service.copyDayLayout({
      termId: 'term-1',
      fromDayOfWeek: 1,
      toDayOfWeek: 2,
    }, 'school-1');

    expect(results).toHaveLength(2);
    expect(results.filter((result: any) => !result.success)).toHaveLength(1);
    expect(service.entryRepo.delete).not.toHaveBeenCalled();
  });

  it('returns every conflict from a multi-slot class clone', async () => {
    const service = makeService([
      { classId: 'source', subjectId: 'subject-a', teacherId: 'teacher-a', dayOfWeek: 1, periodId: 'conflicting-period', isDoublePeriod: false },
      { classId: 'source', subjectId: 'subject-b', teacherId: 'teacher-b', dayOfWeek: 2, periodId: 'conflicting-period', isDoublePeriod: false },
    ]);
    service.classSubjectRepo = { find: jest.fn().mockResolvedValue([]) };

    const results = await service.cloneClassTimetable({
      termId: 'term-1',
      sourceClassId: 'source',
      targetClassId: 'target',
      copyTeachers: true,
    }, 'school-1');

    expect(results).toHaveLength(2);
    expect(results.every((result: any) => !result.success)).toBe(true);
    expect(service.entryRepo.delete).not.toHaveBeenCalled();
  });
});
