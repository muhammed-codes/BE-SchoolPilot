import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Term } from '../../terms/entities/term.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';
import { Period } from './period.entity';

@ObjectType()
@Entity('timetable_entries')
export class TimetableEntry extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  termId!: string;

  @Field(() => Term)
  @ManyToOne(() => Term, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'termId' })
  term!: Term;

  @Field()
  @Column({ type: 'uuid' })
  classId!: string;

  @Field(() => ClassEntity)
  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  classEntity!: ClassEntity;

  @Field()
  @Column({ type: 'uuid' })
  subjectId!: string;

  @Field(() => Subject)
  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subjectId' })
  subject!: Subject;

  @Field()
  @Column({ type: 'uuid' })
  teacherId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher!: User;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  roomId?: string | null;

  @Field(() => Room, { nullable: true })
  @ManyToOne(() => Room, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'roomId' })
  room?: Room | null;

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

  @Field(() => Boolean)
  @Column({ default: false })
  isDoublePeriod!: boolean;
}
