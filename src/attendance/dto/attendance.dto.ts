import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsEnum,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../common/enums';

@InputType()
export class StudentAttendanceRecordInput {
  @Field()
  @IsNotEmpty()
  studentId: string;

  @Field(() => AttendanceStatus)
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

@InputType()
export class MarkAttendanceInput {
  @Field()
  @IsNotEmpty()
  classId: string;

  @Field()
  @IsDateString()
  date: string;

  @Field(() => [StudentAttendanceRecordInput])
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceRecordInput)
  @ArrayMinSize(1)
  records: StudentAttendanceRecordInput[];
}

@InputType()
export class ManualStaffAttendanceInput {
  @Field()
  @IsNotEmpty()
  userId: string;

  @Field()
  @IsDateString()
  date: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  clockInTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  clockOutTime?: string;
}

@ObjectType()
export class AttendanceSummary {
  @Field(() => Int)
  daysPresent: number;

  @Field(() => Int)
  daysAbsent: number;

  @Field(() => Int)
  daysLate: number;

  @Field(() => Int)
  totalMarkedDays: number;
}
