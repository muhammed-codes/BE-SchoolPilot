import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpensePaymentMethod, ExpensePaymentStatus } from '../enums';
import { ExpenseCategory } from './expense-category.entity';
import { ExpenseDepartment } from './expense-department.entity';
import { ExpenseVendor } from './expense-vendor.entity';
import { User } from '../../users/entities/user.entity';
import { Session } from '../../terms/entities/session.entity';
import { Term } from '../../terms/entities/term.entity';

@ObjectType()
@Entity('expenses')
@Index(['schoolId', 'expenseDate'])
@Index(['schoolId', 'categoryId'])
@Index(['schoolId', 'paymentStatus'])
export class Expense extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column()
  title!: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Field()
  @Column({ type: 'date' })
  expenseDate!: Date;

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

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  vendorId?: string;

  @Field(() => ExpenseVendor, { nullable: true })
  @ManyToOne(() => ExpenseVendor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: ExpenseVendor;

  @Field({ nullable: true })
  @Column({ nullable: true })
  vendorName?: string;

  @Field(() => ExpensePaymentMethod)
  @Column({
    type: 'enum',
    enum: ExpensePaymentMethod,
    default: ExpensePaymentMethod.CASH,
  })
  paymentMethod!: ExpensePaymentMethod;

  @Field(() => ExpensePaymentStatus)
  @Column({
    type: 'enum',
    enum: ExpensePaymentStatus,
    default: ExpensePaymentStatus.PAID,
  })
  paymentStatus!: ExpensePaymentStatus;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  referenceNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  receiptUrl?: string;

  @Column({ nullable: true })
  receiptPublicId?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Field()
  @Column({ default: false })
  isVoided!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  voidReason?: string;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  voidedById?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'voidedById' })
  voidedBy?: User;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  voidedAt?: Date;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  requestId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  recurringExpenseId?: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  createdById!: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

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
