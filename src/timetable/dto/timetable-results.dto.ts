import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { Period } from '../entities/period.entity';
import { ConflictSeverity, ConflictType } from '../enums/timetable.enums';
import { PeriodSlotType } from '../enums/timetable.enums';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
export class ConflictViolation {
  @Field(() => ConflictType)
  type!: ConflictType;

  @Field(() => ConflictSeverity)
  severity!: ConflictSeverity;

  @Field()
  message!: string;

  @Field(() => Int, { nullable: true })
  dayOfWeek?: number;

  @Field(() => String, { nullable: true })
  periodId?: string;

  @Field(() => String, { nullable: true })
  classId?: string;

  @Field(() => String, { nullable: true })
  teacherId?: string;

  @Field(() => String, { nullable: true })
  roomId?: string;
}

@ObjectType()
export class TimetableMutationResult {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => TimetableEntry, { nullable: true })
  entry?: TimetableEntry | null;

  @Field(() => [ConflictViolation])
  violations!: ConflictViolation[];
}

@ObjectType()
export class TeacherTimetableResult {
  @Field(() => Boolean)
  isClassTeacher!: boolean;

  @Field(() => ClassEntity, { nullable: true })
  assignedClass?: ClassEntity | null;

  @Field(() => [TimetableEntry])
  entries!: TimetableEntry[];
}

@ObjectType()
export class ChildTimetableResult {
  @Field(() => Student)
  student!: Student;

  @Field(() => ClassEntity, { nullable: true })
  classEntity?: ClassEntity | null;

  @Field(() => [TimetableEntry])
  entries!: TimetableEntry[];
}

@ObjectType()
export class TimetableValidationReport {
  @Field(() => Boolean)
  isValid!: boolean;

  @Field(() => [ConflictViolation])
  blockingConflicts!: ConflictViolation[];

  @Field(() => [ConflictViolation])
  warnings!: ConflictViolation[];
}

@ObjectType()
export class TimetablePdfResult {
  @Field()
  html!: string;

  @Field()
  title!: string;
}

@ObjectType()
export class GeneratedScheduleBlockResult {
  @Field()
  name!: string;

  @Field(() => PeriodSlotType)
  type!: PeriodSlotType;

  @Field()
  startTime!: string;

  @Field()
  endTime!: string;

  @Field(() => Int)
  durationMinutes!: number;

  @Field(() => Int, { nullable: true })
  periodNumber?: number;

  @Field(() => Int)
  order!: number;

  @Field(() => Boolean)
  isTeaching!: boolean;
}

@ObjectType()
export class SchoolDaySchedulePreviewResult {
  @Field(() => Boolean)
  valid!: boolean;

  @Field(() => [String])
  errors!: string[];

  @Field(() => [String])
  warnings!: string[];

  @Field(() => Int)
  teachingPeriodCount!: number;

  @Field(() => [GeneratedScheduleBlockResult])
  blocks!: GeneratedScheduleBlockResult[];
}

@ObjectType()
export class SchoolDayScheduleGenerationResult {
  @Field(() => Boolean)
  success!: boolean;

  @Field()
  message!: string;

  @Field(() => Int)
  existingPeriodCount!: number;

  @Field(() => Int)
  existingAssignmentCount!: number;

  @Field(() => SchoolDaySchedulePreviewResult)
  preview!: SchoolDaySchedulePreviewResult;

  @Field(() => [Period])
  createdPeriods!: Period[];
}
