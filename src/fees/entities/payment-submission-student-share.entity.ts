import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentSubmissionBatch } from './payment-submission-batch.entity';
import { PaymentAllocation } from './payment-allocation.entity';

export enum PaymentShareStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(PaymentShareStatus, { name: 'PaymentShareStatus' });

@ObjectType()
@Entity('payment_submission_student_shares')
@Index(['batchId'])
@Index(['studentId'])
@Index(['status'])
export class PaymentSubmissionStudentShare extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  batchId!: string;

  @Field()
  @Column({ type: 'uuid' })
  studentId!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  amount!: number;

  @Field(() => PaymentShareStatus)
  @Column({
    type: 'enum',
    enum: PaymentShareStatus,
    default: PaymentShareStatus.PENDING,
  })
  status!: PaymentShareStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  finalizedAt!: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  finalizedBy!: string | null;

  @Field(() => PaymentSubmissionBatch)
  @ManyToOne(() => PaymentSubmissionBatch, (batch) => batch.shares, {
    eager: false,
  })
  @JoinColumn({ name: 'batchId' })
  batch!: PaymentSubmissionBatch;

  @Field(() => [PaymentAllocation], { nullable: true })
  @OneToMany(() => PaymentAllocation, (alloc) => alloc.studentShare, {
    eager: false,
  })
  allocations!: PaymentAllocation[];
}
