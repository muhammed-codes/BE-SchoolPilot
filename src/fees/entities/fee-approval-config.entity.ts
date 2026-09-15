import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, Index, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeApprovalStep } from './fee-approval-step.entity';

export enum ApprovalMode {
  SINGLE_APPROVER = 'SINGLE_APPROVER',
  ALL_REQUIRED_SEQUENTIAL = 'ALL_REQUIRED_SEQUENTIAL',
}

registerEnumType(ApprovalMode, { name: 'ApprovalMode' });

@ObjectType()
@Entity('fee_approval_configs')
@Index(['schoolId'])
@Unique(['schoolId', 'feeCategoryId'])
export class FeeApprovalConfig extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  /** null = school-wide default config */
  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  feeCategoryId!: string | null;

  @Field(() => ApprovalMode)
  @Column({
    type: 'enum',
    enum: ApprovalMode,
    default: ApprovalMode.SINGLE_APPROVER,
  })
  mode!: ApprovalMode;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Field(() => [FeeApprovalStep], { nullable: true })
  @OneToMany(() => FeeApprovalStep, (step) => step.approvalConfig, {
    eager: false,
  })
  steps!: FeeApprovalStep[];
}
