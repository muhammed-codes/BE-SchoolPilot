import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class StaffAttendanceRecord {
  @Field({ nullable: true })
  id?: string;

  @Field()
  userId: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  date: string;

  @Field({ nullable: true })
  clockInTime?: string;

  @Field({ nullable: true })
  clockOutTime?: string;

  @Field()
  isLate: boolean;

  @Field()
  isManual: boolean;
}

@ObjectType()
export class StaffAttendanceOverview {
  @Field(() => [StaffAttendanceRecord])
  records: StaffAttendanceRecord[];

  @Field(() => Int)
  totalStaff: number;

  @Field(() => Int)
  presentCount: number;

  @Field(() => Int)
  absentCount: number;

  @Field(() => Int)
  lateCount: number;
}

@ObjectType()
export class ClassAttendanceStatus {
  @Field()
  classId: string;

  @Field()
  className: string;

  @Field(() => User, { nullable: true })
  classTeacher?: User;

  @Field()
  isMarked: boolean;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Int)
  presentStudents: number;

  @Field(() => Int)
  absentStudents: number;

  @Field(() => Int)
  lateStudents: number;
}

@ObjectType()
export class ClassAttendanceOverview {
  @Field(() => [ClassAttendanceStatus])
  classes: ClassAttendanceStatus[];

  @Field(() => Int)
  totalClasses: number;

  @Field(() => Int)
  markedClassesCount: number;

  @Field(() => Int)
  unmarkedClassesCount: number;
}
