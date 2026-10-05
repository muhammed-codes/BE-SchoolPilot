import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import {
  ExpenseRequestType,
  ExpenseRequestStatus,
  ExpenseRequestPaymentStatus,
} from '../enums';
import { ExpenseCategory } from './expense-category.entity';
import { ExpenseDepartment } from './expense-department.entity';
import { ExpenseVendor } from './expense-vendor.entity';
import { Expense } from './expense.entity';
import { User } from '../../users/entities/user.entity';
import { Session } from '../../terms/entities/session.entity';
import { Term } from '../../terms/entities/term.entity';

@ObjectType()
@Entity('expense_requests')
@Index(['schoolId', 'status'])
@Index(['schoolId', 'requesterId'])
@Index(['schoolId', 'categoryId'])
export class ExpenseRequest extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column()
  title!: string;

  @Field(() => ExpenseRequestType)
  @Column({
    type: 'enum',
    enum: ExpenseRequestType,
    default: ExpenseRequestType.MATERIALS_PURCHASE,
  })
  requestType!: ExpenseRequestType;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  estimatedAmount!: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualAmount?: number;

  @Field(() => ExpenseRequestPaymentStatus)
  @Column({
    type: 'enum',
    enum: ExpenseRequestPaymentStatus,
    default: ExpenseRequestPaymentStatus.UNPAID,
  })
  paymentStatus!: ExpenseRequestPaymentStatus;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid!: number;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  categoryId!: string;

  @Field(() => ExpenseCategory, { nullable: true })
  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: ExpenseCategory;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Field(() => ExpenseDepartment, { nullable: true })
  @ManyToOne(() => ExpenseDepartment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: ExpenseDepartment;

  @Field()
  @Column({ type: 'text' })
  reason!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'date', nullable: true })
  neededByDate?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  preferredVendor?: string;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  vendorId?: string;

  @Field(() => ExpenseVendor, { nullable: true })
  @ManyToOne(() => ExpenseVendor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: ExpenseVendor;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  quotationUrls?: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  receiptUrl?: string;

  @Column({ nullable: true })
  receiptPublicId?: string;

  @Field(() => ExpenseRequestStatus)
  @Column({
    type: 'enum',
    enum: ExpenseRequestStatus,
    default: ExpenseRequestStatus.SUBMITTED,
  })
  status!: ExpenseRequestStatus;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  requesterId!: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requesterId' })
  requester?: User;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  approverId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver?: User;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  fundedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  expenseId?: string;

  @Field(() => Expense, { nullable: true })
  @ManyToOne(() => Expense, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'expenseId' })
  expense?: Expense;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @Field(() => Session, { nullable: true })
  @ManyToOne(() => Session, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session?: Session;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  termId?: string;

  @Field(() => Term, { nullable: true })
  @ManyToOne(() => Term, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'termId' })
  term?: Term;
}
