import { ConflictValidatorService } from './conflict-validator.service';
import { ConflictType } from '../enums/timetable.enums';

type Entry = {
  id: string;
  schoolId: string;
  termId: string;
  classId: string;
  teacherId: string;
  dayOfWeek: number;
  period?: { startTime: string; endTime: string };
  subject?: { name: string };
  classEntity?: { name: string };
};

const baseParams = {
  schoolId: 'school-1',
  termId: 'term-1',
  classId: 'class-a',
  subjectId: 'subject-new',
  teacherId: 'teacher-new',
  dayOfWeek: 1,
  periodId: 'period-new',
};

function makeValidator(existingEntries: Entry[], targetPeriod: { startTime: string; endTime: string }) {
  const entryRepo = {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn(async ({ where }: { where: Record<string, string | number> }) =>
      existingEntries.filter((entry) =>
        Object.entries(where).every(([key, value]) => entry[key as keyof Entry] === value),
      ),
    ),
  };

  const validator = new ConflictValidatorService(
    entryRepo as any,
    { findOne: jest.fn().mockResolvedValue(null) } as any,
    { findOne: jest.fn().mockResolvedValue({ fullName: 'Teacher' }) } as any,
    { findOne: jest.fn().mockResolvedValue({ name: 'Class A' }) } as any,
    { findOne: jest.fn() } as any,
    { findOne: jest.fn().mockResolvedValue(null) } as any,
    { findOne: jest.fn().mockResolvedValue(targetPeriod) } as any,
    { find: jest.fn() } as any,
    { count: jest.fn() } as any,
  );

  return { validator, entryRepo };
}

function existing(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'existing-entry',
    schoolId: 'school-1',
    termId: 'term-1',
    classId: 'class-a',
    teacherId: 'teacher-existing',
    dayOfWeek: 1,
    period: { startTime: '10:00', endTime: '11:00' },
    subject: { name: 'Mathematics' },
    classEntity: { name: 'Class A' },
    ...overrides,
  };
}

describe('ConflictValidatorService class time conflicts', () => {
  async function validate(
    targetPeriod: { startTime: string; endTime: string },
    entries: Entry[] = [existing()],
    overrides: Record<string, unknown> = {},
  ) {
    const { validator } = makeValidator(entries, targetPeriod);
    return validator.validateSlot({ ...baseParams, ...overrides } as any);
  }

  it.each([
    ['exact overlap', '10:00', '11:00'],
    ['overlap at the beginning', '10:30', '11:30'],
    ['overlap at the end', '09:30', '10:30'],
    ['containing overlap', '09:00', '12:00'],
    ['contained overlap', '10:15', '10:45'],
  ])('%s is rejected for the same class and day', async (_label, startTime, endTime) => {
    const violations = await validate({ startTime, endTime });
    expect(violations.some((v) => v.type === ConflictType.CLASS_DUPLICATE_SLOT)).toBe(true);
  });

  it('allows a different day', async () => {
    const violations = await validate(
      { startTime: '10:00', endTime: '11:00' },
      [existing()],
      { dayOfWeek: 2 },
    );
    expect(violations.some((v) => v.type === ConflictType.CLASS_DUPLICATE_SLOT)).toBe(false);
  });

  it('allows a different class at the same time', async () => {
    const violations = await validate(
      { startTime: '10:00', endTime: '11:00' },
      [existing({ classId: 'class-b' })],
    );
    expect(violations.some((v) => v.type === ConflictType.CLASS_DUPLICATE_SLOT)).toBe(false);
  });

  it('does not treat the entry being updated as its own conflict', async () => {
    const violations = await validate(
      { startTime: '10:00', endTime: '11:00' },
      [existing({ id: 'entry-being-updated' })],
      { entryId: 'entry-being-updated' },
    );
    expect(violations.some((v) => v.type === ConflictType.CLASS_DUPLICATE_SLOT)).toBe(false);
  });

  it('rejects an update into another overlapping entry', async () => {
    const violations = await validate(
      { startTime: '10:30', endTime: '11:30' },
      [existing({ id: 'other-entry' })],
      { entryId: 'entry-being-updated' },
    );
    expect(violations.some((v) => v.type === ConflictType.CLASS_DUPLICATE_SLOT)).toBe(true);
  });
});
