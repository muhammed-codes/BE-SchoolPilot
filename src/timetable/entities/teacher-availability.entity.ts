import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Period } from './period.entity';
import {
  AvailabilityStatus,
  AvailabilitySource,
  ApprovalStatus,
} from '../enums/timetable.enums';

@ObjectType()
@Entity('teacher_availabilities')
@Unique(['schoolId', 'teacherId', 'dayOfWeek', 'periodId'])
export class TeacherAvailability extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  teacherId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher!: User;

  @Field(() => Int)
  @Column({ type: 'int' })
  dayOfWeek!: number;

  @Field()
  @Column({ type: 'uuid' })
  periodId!: string;

  @Field(() => Period)
  @ManyToOne(() => Period, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'periodId' })
  period!: Period;

  @Field(() => AvailabilityStatus)
  @Column({ type: 'varchar', default: AvailabilityStatus.AVAILABLE })
  status!: AvailabilityStatus;

  @Field(() => AvailabilitySource)
  @Column({ type: 'varchar', default: AvailabilitySource.SELF_SUBMITTED })
  source!: AvailabilitySource;

  @Field(() => ApprovalStatus)
  @Column({ type: 'varchar', default: ApprovalStatus.PENDING })
  approvalStatus!: ApprovalStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
