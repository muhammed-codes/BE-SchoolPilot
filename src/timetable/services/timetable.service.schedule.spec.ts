import { ScheduleGeneratorService } from './schedule-generator.service';
import { TimetableService } from './timetable.service';

const input = {
  dayOfWeeks: [1, 2],
  classIds: [],
  startTime: '08:00',
  endTime: '10:00',
  teachingDurationMinutes: 40,
  blocks: [],
};

function makeService(periodCount: number, assignmentCount: number) {
  const service = Object.create(TimetableService.prototype) as any;
  service.scheduleGenerator = new ScheduleGeneratorService();
  service.periodRepo = { count: jest.fn().mockResolvedValue(periodCount) };
  service.entryRepo = { count: jest.fn().mockResolvedValue(assignmentCount) };
  service.classRepo = { count: jest.fn().mockResolvedValue(0) };
  service.dataSource = { transaction: jest.fn() };
  return service;
}

describe('TimetableService school-day schedule API', () => {
  it('previews without querying or mutating persistence', async () => {
    const service = makeService(0, 0);
    const result = await service.previewSchoolDaySchedule(input, 'school-1');

    expect(result.valid).toBe(true);
    expect(result.teachingPeriodCount).toBe(3);
    expect(service.periodRepo.count).not.toHaveBeenCalled();
    expect(service.entryRepo.count).not.toHaveBeenCalled();
    expect(service.dataSource.transaction).not.toHaveBeenCalled();
  });

  it('protects existing periods and assignments during generation', async () => {
    const service = makeService(3, 1);
    const result = await service.generateSchoolDaySchedule(input, 'school-1');

    expect(result.success).toBe(false);
    expect(result.existingPeriodCount).toBe(3);
    expect(result.existingAssignmentCount).toBe(1);
    expect(result.createdPeriods).toEqual([]);
    expect(service.dataSource.transaction).not.toHaveBeenCalled();
  });

  it('persists generated blocks in one transaction for a fresh school', async () => {
    const service = makeService(0, 0);
    const savedPeriods = [{ id: 'period-1' }];
    const save = jest.fn().mockResolvedValue(savedPeriods);
    const create = jest.fn((value) => value);
    service.dataSource.transaction.mockImplementation(async (callback: Function) =>
      callback({ getRepository: () => ({ create, save }) }),
    );

    const result = await service.generateSchoolDaySchedule(input, 'school-1');

    expect(result.success).toBe(true);
    expect(service.dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(6);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.createdPeriods).toEqual(savedPeriods);
  });

  it('persists each generated block for every selected day and class scope', async () => {
    const service = makeService(0, 0);
    service.classRepo.count.mockResolvedValue(2);
    const created: any[] = [];
    service.dataSource.transaction.mockImplementation(async (callback: Function) =>
      callback({
        getRepository: () => ({
          create: jest.fn((value) => {
            created.push(value);
            return value;
          }),
          save: jest.fn().mockResolvedValue(created),
        }),
      }),
    );

    const result = await service.generateSchoolDaySchedule({
      ...input,
      dayOfWeeks: [3, 1],
      classIds: ['class-1', 'class-2'],
    } as any, 'school-1');

    expect(result.success).toBe(true);
    expect(created).toHaveLength(6);
    expect(new Set(created.map((period) => period.dayOfWeek))).toEqual(new Set([1, 3]));
    expect(created.every((period) => period.classIds.join(',') === 'class-1,class-2')).toBe(true);
  });

  it('rejects invalid schedule scope before preview or persistence', async () => {
    const service = makeService(0, 0);
    await expect(service.previewSchoolDaySchedule({ ...input, dayOfWeeks: [0], classIds: [] } as any, 'school-1'))
      .rejects.toThrow('Select valid days');
  });
});
