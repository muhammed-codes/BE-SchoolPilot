import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum FeeRecurrence {
  PER_TERM = 'PER_TERM',
  PER_SESSION = 'PER_SESSION',
  ONE_TIME = 'ONE_TIME',
}

registerEnumType(FeeRecurrence, { name: 'FeeRecurrence' });

@ObjectType()
@Entity('fee_categories')
@Index(['schoolId'])
export class FeeCategory extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => FeeRecurrence)
  @Column({
    type: 'enum',
    enum: FeeRecurrence,
    default: FeeRecurrence.PER_TERM,
  })
  recurrence!: FeeRecurrence;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;
}
