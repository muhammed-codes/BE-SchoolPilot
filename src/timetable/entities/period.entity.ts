import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('periods')
export class Period extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  startTime!: string; // e.g. "08:00"

  @Field()
  @Column()
  endTime!: string; // e.g. "08:45"

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  orderIndex!: number;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive!: boolean;
}
