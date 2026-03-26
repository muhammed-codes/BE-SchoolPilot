import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AttendanceStatus } from '../../common/enums';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import { Term } from '../../terms/entities/term.entity';

@ObjectType()
@Entity('student_attendance')
@Unique(['studentId', 'date'])
export class StudentAttendance extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  studentId: string;

  @Field()
  @Column({ type: 'uuid' })
  classId: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field()
  @Column({ type: 'uuid' })
  termId: string;

  @Field()
  @Column({ type: 'date' })
  date: string;

  @Field(() => AttendanceStatus)
  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Field()
  @Column({ type: 'uuid' })
  markedByUserId: string;

  @Field()
  @Column({ type: 'timestamp' })
  markedAt: Date;

  @Field(() => Student)
  @ManyToOne(() => Student, { eager: false })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Field(() => ClassEntity)
  @ManyToOne(() => ClassEntity, { eager: false })
  @JoinColumn({ name: 'classId' })
  classEntity: ClassEntity;

  @Field(() => User)
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'markedByUserId' })
  markedByUser: User;

  @Field(() => Term)
  @ManyToOne(() => Term, { eager: false })
  @JoinColumn({ name: 'termId' })
  term: Term;
}
