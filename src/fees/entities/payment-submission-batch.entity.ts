import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentSubmissionStudentShare } from './payment-submission-student-share.entity';
import { SchoolBankAccount } from './school-bank-account.entity';

@ObjectType()
@Entity('payment_submission_batches')
@Index(['schoolId'])
@Index(['parentId'])
export class PaymentSubmissionBatch extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  parentId!: string;

  @Field()
  @Column()
  proofUrl!: string;

  @Field()
  @Column({ default: 'image' })
  proofType!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  bankAccountId!: string | null;

  @Field(() => Int)
  @Column({ type: 'int' })
  totalAmount!: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Field()
  @Column({ type: 'timestamp', default: () => 'now()' })
  submittedAt!: Date;

  @Field(() => [PaymentSubmissionStudentShare], { nullable: true })
  @OneToMany(() => PaymentSubmissionStudentShare, (share) => share.batch, {
    eager: false,
  })
  shares!: PaymentSubmissionStudentShare[];

  @Field(() => SchoolBankAccount, { nullable: true })
  @ManyToOne(() => SchoolBankAccount, { eager: false, nullable: true })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount!: SchoolBankAccount | null;
}
