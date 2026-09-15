import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeStructure } from './fee-structure.entity';

export enum FeeOverrideType {
  DISCOUNT = 'DISCOUNT',
  SCHOLARSHIP = 'SCHOLARSHIP',
  WAIVER = 'WAIVER',
  ADJUSTMENT = 'ADJUSTMENT',
}

registerEnumType(FeeOverrideType, { name: 'FeeOverrideType' });

@ObjectType()
@Entity('student_fee_overrides')
@Index(['schoolId'])
@Index(['studentId'])
@Unique(['studentId', 'feeStructureId'])
export class StudentFeeOverride extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  studentId!: string;

  @Field()
  @Column({ type: 'uuid' })
  feeStructureId!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  overrideAmount!: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Field(() => FeeOverrideType)
  @Column({
    type: 'enum',
    enum: FeeOverrideType,
    default: FeeOverrideType.ADJUSTMENT,
  })
  type!: FeeOverrideType;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Field(() => FeeStructure)
  @ManyToOne(() => FeeStructure, { eager: false })
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure!: FeeStructure;
}
