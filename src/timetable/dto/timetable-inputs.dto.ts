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
} from 'class-validator';
import {
  RoomType,
  NonTeachingSlotType,
  AvailabilityStatus,
  ApprovalStatus,
  TimetableExportView,
} from '../enums/timetable.enums';

// ── Room Inputs ─────────────────────────────────────────────────────────────
@InputType()
export class CreateRoomInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field(() => Int, { defaultValue: 30 })
  @IsNumber()
  @Min(1)
  capacity!: number;

  @Field(() => RoomType, { defaultValue: RoomType.CLASSROOM })
  type!: RoomType;
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
}

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
  type!: NonTeachingSlotType;

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
  status!: AvailabilityStatus;

  @Field(() => ApprovalStatus, { defaultValue: ApprovalStatus.APPROVED })
  approvalStatus!: ApprovalStatus;

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
export class ExportTimetablePdfInput {
  @Field(() => String)
  @IsUUID()
  termId!: string;

  @Field(() => TimetableExportView)
  viewType!: TimetableExportView;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  targetId?: string; // classId, teacherId, or roomId
}
