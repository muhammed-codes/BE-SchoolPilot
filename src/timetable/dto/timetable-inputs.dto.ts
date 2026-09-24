import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import {
  RoomType,
  NonTeachingSlotType,
  AvailabilityStatus,
  ApprovalStatus,
  TimetableExportView,
  PeriodSlotType,
  ScheduleBlockPlacement,
} from '../enums/timetable.enums';
import { SCHEDULE_BLOCK_TYPES } from '../services/schedule-generator.service';

// ── Room Inputs ─────────────────────────────────────────────────────────────
@InputType()
export class CreateRoomInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @Field(() => RoomType, { defaultValue: RoomType.CLASSROOM })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;
}

@InputType()
export class UpdateRoomInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @Field(() => RoomType, { nullable: true })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ── SchoolDay Inputs ────────────────────────────────────────────────────────
@InputType()
export class UpdateSchoolDayInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => Boolean)
  @IsBoolean()
  isTeachingDay!: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  dayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  closingTime?: string;
}

// ── Period Inputs ───────────────────────────────────────────────────────────
@InputType()
export class CreatePeriodInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsNumber()
  orderIndex!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  dayOfWeek?: number | null;

  @Field(() => PeriodSlotType, { defaultValue: PeriodSlotType.TEACHING })
  @IsEnum(PeriodSlotType)
  slotType: PeriodSlotType = PeriodSlotType.TEACHING;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsUUID('4', { each: true })
  classIds?: string[];
}

@InputType()
export class UpdatePeriodInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  startTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  endTime?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => PeriodSlotType, { nullable: true })
  @IsOptional()
  @IsEnum(PeriodSlotType)
  slotType?: PeriodSlotType;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsUUID('4', { each: true })
  classIds?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  dayOfWeek?: number | null;
}

@InputType()
export class ScheduleBlockConfigInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field(() => PeriodSlotType)
  @IsEnum(PeriodSlotType)
  type!: (typeof SCHEDULE_BLOCK_TYPES)[number];

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @Field(() => ScheduleBlockPlacement)
  @IsEnum(ScheduleBlockPlacement)
  placement!: ScheduleBlockPlacement;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  afterPeriodNumber?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  atTime?: string;
}

@InputType()
export class PreviewSchoolDayScheduleInput {
  @Field(() => [Int])
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  dayOfWeeks!: number[];

  /** Empty means the explicitly selected entire school; non-empty scopes to those classes. */
  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsUUID('4', { each: true })
  classIds!: string[];

  @Field()
  @IsString()
  startTime!: string;

  @Field()
  @IsString()
  endTime!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  teachingDurationMinutes!: number;

  @Field(() => [ScheduleBlockConfigInput], { defaultValue: [] })
  @IsArray()
  blocks!: ScheduleBlockConfigInput[];
}

@InputType()
export class GenerateSchoolDayScheduleInput extends PreviewSchoolDayScheduleInput {}

@InputType()
export class ReorderPeriodItem {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => Int)
  @IsNumber()
  orderIndex!: number;
}

// ── NonTeachingSlot Inputs ──────────────────────────────────────────────────
@InputType()
export class CreateNonTeachingSlotInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field(() => NonTeachingSlotType, { defaultValue: NonTeachingSlotType.BREAK })
  @IsOptional()
  @IsEnum(NonTeachingSlotType)
  type?: NonTeachingSlotType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  startTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  endTime?: string;
}

@InputType()
export class UpdateNonTeachingSlotInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => NonTeachingSlotType, { nullable: true })
  @IsOptional()
  @IsEnum(NonTeachingSlotType)
  type?: NonTeachingSlotType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  dayOfWeek?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  periodId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  startTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  endTime?: string;
}

// ── Class Subject Assignment Inputs ────────────────────────────────────────
@InputType()
export class AssignClassSubjectInput {
  @Field(() => String)
  @IsUUID()
  classId!: string;

  @Field(() => String)
  @IsUUID()
  subjectId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isDoublePeriod!: boolean;

  @Field(() => Int, { defaultValue: 4 })
  @IsNumber()
  @Min(1)
  periodsPerWeek!: number;
}

@InputType()
export class UpdateClassSubjectAssignmentInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDoublePeriod?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  periodsPerWeek?: number;
}

// ── Teacher Availability Inputs ─────────────────────────────────────────────
@InputType()
export class SubmitTeacherAvailabilityInput {
  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @Field(() => String)
  @IsUUID()
  periodId!: string;

  @Field(() => AvailabilityStatus)
  @IsEnum(AvailabilityStatus)
  status!: AvailabilityStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class AdminSetTeacherAvailabilityInput {
  @Field(() => String)
  @IsUUID()
  teacherId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @Field(() => String)
  @IsUUID()
  periodId!: string;

  @Field(() => AvailabilityStatus)
  @IsEnum(AvailabilityStatus)
  status!: AvailabilityStatus;

  @Field(() => ApprovalStatus, { defaultValue: ApprovalStatus.APPROVED })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class ReviewTeacherAvailabilityInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => ApprovalStatus)
  @IsEnum(ApprovalStatus)
  approvalStatus!: ApprovalStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Timetable Entry CRUD Inputs ─────────────────────────────────────────────
@InputType()
export class CreateTimetableEntryInput {
  @Field(() => String)
  @IsUUID()
  termId!: string;

  @Field(() => String)
  @IsUUID()
  classId!: string;

  @Field(() => String)
  @IsUUID()
  subjectId!: string;

  @Field(() => String)
  @IsUUID()
  teacherId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @Field(() => String)
  @IsUUID()
  periodId!: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isDoublePeriod!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowOverride!: boolean;
}

@InputType()
export class UpdateTimetableEntryInput {
  @Field(() => String)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDoublePeriod?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowOverride!: boolean;
}

// ── Bulk & Utility Inputs ───────────────────────────────────────────────────
@InputType()
export class CopyDayLayoutInput {
  @Field(() => String)
  @IsUUID()
  termId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(7)
  fromDayOfWeek!: number;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(7)
  toDayOfWeek!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowOverride!: boolean;
}

@InputType()
export class CloneClassTimetableInput {
  @Field(() => String)
  @IsUUID()
  termId!: string;

  @Field(() => String)
  @IsUUID()
  sourceClassId!: string;

  @Field(() => String)
  @IsUUID()
  targetClassId!: string;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  copyTeachers!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowOverride!: boolean;
}

@InputType()
export class UpdateTeacherWorkloadInput {
  @Field(() => String)
  @IsUUID()
  teacherId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  maxPeriodsPerDay!: number;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  maxPeriodsPerWeek!: number;
}

@InputType()
export class UpdateTeachersWorkloadInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  teacherIds?: string[];

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  maxPeriodsPerDay!: number;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  maxPeriodsPerWeek!: number;
}

@InputType()
export class ExportTimetablePdfInput {
  @Field(() => String)
  @IsUUID()
  termId!: string;

  @Field(() => TimetableExportView)
  @IsEnum(TimetableExportView)
  viewType!: TimetableExportView;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  targetId?: string; // classId, teacherId, or roomId
}
