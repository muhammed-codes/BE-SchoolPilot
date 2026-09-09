import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('school_days')
@Unique(['schoolId', 'dayOfWeek'])
export class SchoolDay extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  dayOfWeek!: number; // 1 = Monday, ..., 7 = Sunday

  @Field()
  @Column()
  dayName!: string;

  @Field(() => Boolean)
  @Column({ default: true })
  isTeachingDay!: boolean;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  orderIndex!: number;
}
