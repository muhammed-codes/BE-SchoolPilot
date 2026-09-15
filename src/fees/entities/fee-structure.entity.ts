import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeCategory } from './fee-category.entity';

@ObjectType()
@Entity('fee_structures')
@Index(['schoolId'])
@Index(['sessionId', 'termId'])
@Unique(['schoolId', 'feeCategoryId', 'classId', 'termId', 'sessionId'])
export class FeeStructure extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  feeCategoryId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  classId!: string | null;

  @Field()
  @Column({ type: 'uuid' })
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  termId!: string | null;

  @Field(() => Int)
  @Column({ type: 'int' })
  amount!: number;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Field(() => FeeCategory)
  @ManyToOne(() => FeeCategory, { eager: false })
  @JoinColumn({ name: 'feeCategoryId' })
  feeCategory!: FeeCategory;
}
