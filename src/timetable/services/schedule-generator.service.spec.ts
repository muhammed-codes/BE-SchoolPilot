import { ScheduleGeneratorService } from './schedule-generator.service';

describe('ScheduleGeneratorService', () => {
  const generator = new ScheduleGeneratorService();

  it('generates deterministic teaching periods without blocks', () => {
    const result = generator.generate({
      startTime: '08:00',
      endTime: '10:00',
      teachingDurationMinutes: 40,
      blocks: [],
    });

    expect(result.valid).toBe(true);
    expect(result.teachingPeriodCount).toBe(3);
    expect(result.blocks.map(({ name, startTime, endTime }) => ({ name, startTime, endTime }))).toEqual([
      { name: 'Period 1', startTime: '08:00', endTime: '08:40' },
      { name: 'Period 2', startTime: '08:40', endTime: '09:20' },
      { name: 'Period 3', startTime: '09:20', endTime: '10:00' },
    ]);
  });

  it('places assembly before teaching and multiple breaks after periods', () => {
    const result = generator.generate({
      startTime: '08:00',
      endTime: '12:00',
      teachingDurationMinutes: 40,
      blocks: [
        { name: 'Assembly', type: 'ASSEMBLY', durationMinutes: 20, placement: 'BEFORE_TEACHING' },
        { name: 'Short Break', type: 'BREAK', durationMinutes: 15, placement: 'AFTER_PERIOD', afterPeriodNumber: 2 },
        { name: 'Lunch', type: 'LUNCH', durationMinutes: 30, placement: 'AFTER_PERIOD', afterPeriodNumber: 4 },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.blocks.map((block) => `${block.name}:${block.startTime}-${block.endTime}`)).toEqual([
      'Assembly:08:00-08:20',
      'Period 1:08:20-09:00',
      'Period 2:09:00-09:40',
      'Short Break:09:40-09:55',
      'Period 3:09:55-10:35',
      'Period 4:10:35-11:15',
      'Lunch:11:15-11:45',
      'Unallocated time:11:45-12:00',
    ]);
    expect(result.blocks.some((block) => block.name === 'Unallocated time')).toBe(true);
  });

  it('supports a timed activity and reports intentional gaps', () => {
    const result = generator.generate({
      startTime: '08:00',
      endTime: '11:00',
      teachingDurationMinutes: 40,
      blocks: [
        { name: 'Prayer', type: 'PRAYER', durationMinutes: 10, placement: 'AT_TIME', atTime: '09:30' },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.blocks.some((block) => block.name === 'Prayer')).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it.each([
    ['end before start', { startTime: '14:00', endTime: '08:00' }],
    ['equal start and end', { startTime: '08:00', endTime: '08:00' }],
    ['invalid time', { startTime: '8:00', endTime: '10:00' }],
  ])('rejects %s', (_label, times) => {
    const result = generator.generate({
      ...times,
      teachingDurationMinutes: 40,
      blocks: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid durations and blocks outside school hours', () => {
    const result = generator.generate({
      startTime: '08:00',
      endTime: '10:00',
      teachingDurationMinutes: 0,
      blocks: [
        { name: 'Lunch', type: 'LUNCH', durationMinutes: 30, placement: 'AT_TIME', atTime: '09:50' },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('Teaching period duration'),
    ]));

    const outside = generator.generate({
      startTime: '08:00',
      endTime: '10:00',
      teachingDurationMinutes: 40,
      blocks: [
        { name: 'Lunch', type: 'LUNCH', durationMinutes: 30, placement: 'AT_TIME', atTime: '09:50' },
      ],
    });
    expect(outside.valid).toBe(false);
    expect(outside.errors).toContain('Every timed schedule block must fit within school hours.');
  });

  it('does not mutate its input configuration', () => {
    const input = {
      startTime: '08:00',
      endTime: '10:00',
      teachingDurationMinutes: 40,
      blocks: [{ name: 'Assembly', type: 'ASSEMBLY' as const, durationMinutes: 10, placement: 'BEFORE_TEACHING' as const }],
    };
    const copy = JSON.parse(JSON.stringify(input));
    generator.generate(input);
    expect(input).toEqual(copy);
  });

  it('can promote an unallocated gap into a standalone teaching period', () => {
    const result = generator.generate({
      startTime: '08:00',
      endTime: '10:00',
      teachingDurationMinutes: 40,
      blocks: [{ name: 'Lunch', type: 'LUNCH', durationMinutes: 20, placement: 'AT_TIME', atTime: '09:40' }],
      unallocatedTimeAsPeriod: true,
    });

    expect(result.valid).toBe(true);
    expect(result.blocks.some((block) => block.name === 'Period 3' && block.isTeaching)).toBe(true);
  });
});
