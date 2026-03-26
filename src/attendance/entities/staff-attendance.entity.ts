import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('staff_attendance')
@Unique(['userId', 'date'])
export class StaffAttendance extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  userId: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field()
  @Column({ type: 'date' })
  date: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  clockInTime: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  clockOutTime: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isLate: boolean;

  @Field()
  @Column({ default: false })
  isManual: boolean;

  @Field(() => User)
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
