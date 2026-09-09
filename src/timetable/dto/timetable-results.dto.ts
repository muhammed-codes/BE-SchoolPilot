import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { ConflictSeverity, ConflictType } from '../enums/timetable.enums';
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
