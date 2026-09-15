import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentSubmissionStudentShare } from './payment-submission-student-share.entity';

@ObjectType()
@Entity('payment_allocations')
@Index(['studentShareId'])
export class PaymentAllocation extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  studentShareId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  studentInvoiceItemId!: string | null;

  @Field(() => Int)
  @Column({ type: 'int' })
  amount!: number;

  @Field()
  @Column({ type: 'uuid' })
  allocatedBy!: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'now()' })
  allocatedAt!: Date;

  @Field(() => PaymentSubmissionStudentShare)
  @ManyToOne(
    () => PaymentSubmissionStudentShare,
    (share) => share.allocations,
    {
      eager: false,
    },
  )
  @JoinColumn({ name: 'studentShareId' })
  studentShare!: PaymentSubmissionStudentShare;
}
