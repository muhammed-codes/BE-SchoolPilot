import { ScheduleGeneratorService } from './schedule-generator.service';
import { TimetableService } from './timetable.service';

const input = {
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
  service.dataSource = { transaction: jest.fn() };
  return service;
}

describe('TimetableService school-day schedule API', () => {
  it('previews without querying or mutating persistence', async () => {
    const service = makeService(0, 0);
    const result = await service.previewSchoolDaySchedule(input);

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
    expect(create).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.createdPeriods).toEqual(savedPeriods);
  });
});
