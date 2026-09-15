import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeApprovalConfig } from './fee-approval-config.entity';

export enum ApproverType {
  SPECIFIC_STAFF = 'SPECIFIC_STAFF',
  ROLE = 'ROLE',
}

registerEnumType(ApproverType, { name: 'ApproverType' });

@ObjectType()
@Entity('fee_approval_steps')
export class FeeApprovalStep extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  approvalConfigId!: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  sequenceOrder!: number;

  @Field(() => ApproverType)
  @Column({
    type: 'enum',
    enum: ApproverType,
    default: ApproverType.ROLE,
  })
  approverType!: ApproverType;

  /** FK to User when approverType = SPECIFIC_STAFF */
  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  approverId!: string | null;

  /** Role string when approverType = ROLE (e.g. 'bursar') */
  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  approverRole!: string | null;

  @Field(() => FeeApprovalConfig)
  @ManyToOne(() => FeeApprovalConfig, (cfg) => cfg.steps, { eager: false })
  @JoinColumn({ name: 'approvalConfigId' })
  approvalConfig!: FeeApprovalConfig;
}
