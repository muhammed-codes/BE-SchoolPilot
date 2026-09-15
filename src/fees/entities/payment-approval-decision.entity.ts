import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeApprovalStep } from './fee-approval-step.entity';

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(ApprovalDecision, { name: 'ApprovalDecision' });

@ObjectType()
@Entity('payment_approval_decisions')
@Index(['studentShareId'])
export class PaymentApprovalDecision extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  studentShareId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  approvalStepId!: string | null;

  @Field()
  @Column({ type: 'uuid' })
  decidedBy!: string;

  @Field(() => ApprovalDecision)
  @Column({ type: 'enum', enum: ApprovalDecision })
  decision!: ApprovalDecision;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Field()
  @Column({ type: 'timestamp', default: () => 'now()' })
  decidedAt!: Date;

  @Field(() => FeeApprovalStep, { nullable: true })
  @ManyToOne(() => FeeApprovalStep, { eager: false, nullable: true })
  @JoinColumn({ name: 'approvalStepId' })
  approvalStep!: FeeApprovalStep | null;
}
