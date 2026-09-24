export const SCHEDULE_BLOCK_TYPES = [
  'TEACHING',
  'BREAK',
  'ASSEMBLY',
  'REGISTRATION',
  'PRAYER',
  'LUNCH',
  'ACTIVITY',
  'EXTRACURRICULAR',
  'STUDY',
  'TRANSITION',
  'CUSTOM',
] as const;

export type ScheduleBlockType = (typeof SCHEDULE_BLOCK_TYPES)[number];
export type ScheduleBlockPlacement =
  | 'BEFORE_TEACHING'
  | 'AFTER_PERIOD'
  | 'AT_TIME';

export interface ScheduleBlockConfig {
  name: string;
  type: ScheduleBlockType;
  durationMinutes: number;
  placement: ScheduleBlockPlacement;
  afterPeriodNumber?: number;
  atTime?: string;
}

export interface GenerateScheduleInput {
  startTime: string;
  endTime: string;
  teachingDurationMinutes: number;
  blocks: ScheduleBlockConfig[];
}

export interface GeneratedScheduleBlock {
  name: string;
  type: ScheduleBlockType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  periodNumber?: number;
  order: number;
  isTeaching: boolean;
}

export interface GeneratedSchedule {
  valid: boolean;
  errors: string[];
  warnings: string[];
  teachingPeriodCount: number;
  blocks: GeneratedScheduleBlock[];
}

const MINUTES_PER_DAY = 24 * 60;

function parseTime(value: string, label: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error(`${label} must use 24-hour HH:MM format.`);
  }
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60).toString().padStart(2, '0');
  const minutes = (normalized % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function assertDuration(duration: number, label: string): void {
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error(`${label} must be a positive whole number of minutes.`);
  }
}

/** Pure, deterministic school-day structure generator. It never reads or writes application state. */
export class ScheduleGeneratorService {
  generate(input: GenerateScheduleInput): GeneratedSchedule {
    const errors: string[] = [];
    const warnings: string[] = [];
    const generated: GeneratedScheduleBlock[] = [];

    let schoolStart: number;
    let schoolEnd: number;
    try {
      schoolStart = parseTime(input.startTime, 'School start time');
      schoolEnd = parseTime(input.endTime, 'School end time');
    } catch (error) {
      return this.invalid(error instanceof Error ? error.message : String(error));
    }

    if (schoolEnd <= schoolStart) {
      errors.push('School end time must be after school start time.');
    }
    try {
      assertDuration(input.teachingDurationMinutes, 'Teaching period duration');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    if (errors.length > 0) return this.result(errors, warnings, generated);

    const beforeTeaching = input.blocks.filter((block) => block.placement === 'BEFORE_TEACHING');
    const afterPeriods = new Map<number, ScheduleBlockConfig[]>();
    const atTimes: Array<{ block: ScheduleBlockConfig; time: number; index: number }> = [];

    input.blocks.forEach((block, index) => {
      if (!block.name.trim()) errors.push('Every schedule block must have a name.');
      try {
        assertDuration(block.durationMinutes, `Duration for ${block.name || 'schedule block'}`);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      if (block.placement === 'AFTER_PERIOD') {
        if (!Number.isInteger(block.afterPeriodNumber) || (block.afterPeriodNumber || 0) < 1) {
          errors.push(`${block.name || 'Schedule block'} must specify a valid period number.`);
        } else {
          const list = afterPeriods.get(block.afterPeriodNumber!) || [];
          list.push(block);
          afterPeriods.set(block.afterPeriodNumber!, list);
        }
      }

      if (block.placement === 'AT_TIME') {
        if (!block.atTime) {
          errors.push(`${block.name || 'Schedule block'} must specify a time.`);
        } else {
          try {
            atTimes.push({ block, time: parseTime(block.atTime, `${block.name} time`), index });
          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
          }
        }
      }
    });

    for (const block of beforeTeaching) {
      this.addBlock(generated, block.name, block.type, schoolStart + this.totalDuration(generated), block.durationMinutes);
    }

    if (errors.length > 0) return this.result(errors, warnings, generated);

    atTimes.sort((a, b) => a.time - b.time || a.index - b.index);
    for (let index = 1; index < atTimes.length; index += 1) {
      if (atTimes[index].time < atTimes[index - 1].time + atTimes[index - 1].block.durationMinutes) {
        errors.push(`Schedule blocks at ${formatTime(atTimes[index - 1].time)} and ${formatTime(atTimes[index].time)} overlap.`);
      }
    }
    if (atTimes.some(({ time, block }) => time < schoolStart || time + block.durationMinutes > schoolEnd)) {
      errors.push('Every timed schedule block must fit within school hours.');
    }
    if (errors.length > 0) return this.result(errors, warnings, generated);

    let cursor = schoolStart + this.totalDuration(generated);
    let periodNumber = 0;
    let atTimeIndex = 0;

    while (cursor < schoolEnd) {
      const timedBlock = atTimes[atTimeIndex];
      if (timedBlock && timedBlock.time < cursor) {
        errors.push(`${timedBlock.block.name} overlaps an earlier generated block.`);
        break;
      }
      if (timedBlock && timedBlock.time === cursor) {
        this.addBlock(generated, timedBlock.block.name, timedBlock.block.type, cursor, timedBlock.block.durationMinutes);
        cursor += timedBlock.block.durationMinutes;
        atTimeIndex += 1;
        continue;
      }

      const nextBoundary = timedBlock?.time ?? schoolEnd;
      const availableMinutes = nextBoundary - cursor;
      if (availableMinutes < input.teachingDurationMinutes) {
        if (availableMinutes > 0) {
          this.addBlock(generated, 'Unallocated time', 'TRANSITION', cursor, availableMinutes);
          cursor = nextBoundary;
        }
        continue;
      }

      periodNumber += 1;
      const teachingStart = cursor;
      this.addBlock(generated, `Period ${periodNumber}`, 'TEACHING', teachingStart, input.teachingDurationMinutes, periodNumber);
      cursor += input.teachingDurationMinutes;

      const placedAfter = afterPeriods.get(periodNumber) || [];
      for (const block of placedAfter) {
        if (cursor + block.durationMinutes > schoolEnd) {
          errors.push(`${block.name} after Period ${periodNumber} does not fit before school closing time.`);
          continue;
        }
        this.addBlock(generated, block.name, block.type, cursor, block.durationMinutes);
        cursor += block.durationMinutes;
      }
    }

    for (const [afterPeriod, blocks] of afterPeriods) {
      if (afterPeriod > periodNumber) {
        errors.push(`${blocks.map((block) => block.name).join(', ')} cannot be placed after Period ${afterPeriod}; only ${periodNumber} teaching periods fit.`);
      }
    }
    if (periodNumber === 0) errors.push('The configuration does not leave room for a teaching period.');
    if (atTimeIndex < atTimes.length) errors.push('Not all timed schedule blocks could be placed.');
    if (generated.length > 0 && generated[generated.length - 1].endTime !== formatTime(schoolEnd)) {
      warnings.push(`The generated structure leaves intentional unallocated time before ${formatTime(schoolEnd)}.`);
    }

    return this.result(errors, warnings, generated, periodNumber);
  }

  private addBlock(
    blocks: GeneratedScheduleBlock[],
    name: string,
    type: ScheduleBlockType,
    startMinutes: number,
    durationMinutes: number,
    periodNumber?: number,
  ): void {
    blocks.push({
      name,
      type,
      startTime: formatTime(startMinutes),
      endTime: formatTime(startMinutes + durationMinutes),
      durationMinutes,
      periodNumber,
      order: blocks.length + 1,
      isTeaching: type === 'TEACHING',
    });
  }

  private totalDuration(blocks: GeneratedScheduleBlock[]): number {
    return blocks.reduce((total, block) => total + block.durationMinutes, 0);
  }

  private result(
    errors: string[],
    warnings: string[],
    blocks: GeneratedScheduleBlock[],
    teachingPeriodCount = blocks.filter((block) => block.isTeaching).length,
  ): GeneratedSchedule {
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      teachingPeriodCount,
      blocks,
    };
  }

  private invalid(message: string): GeneratedSchedule {
    return this.result([message], [], []);
  }
}
