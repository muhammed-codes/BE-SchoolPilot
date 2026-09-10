import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { NonTeachingSlotType } from '../enums/timetable.enums';
import { Period } from './period.entity';

@ObjectType()
@Entity('non_teaching_slots')
export class NonTeachingSlot extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => NonTeachingSlotType)
  @Column({ type: 'varchar', default: NonTeachingSlotType.BREAK })
  type!: NonTeachingSlotType;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  dayOfWeek?: number | null; // null = all days

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  periodId?: string | null;

  @Field(() => Period, { nullable: true })
  @ManyToOne(() => Period, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'periodId' })
  period?: Period | null;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  startTime?: string | null;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  endTime?: string | null;
}
