import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RecurringFrequency } from '../enums';
import { ExpenseCategory } from './expense-category.entity';
import { ExpenseVendor } from './expense-vendor.entity';

@ObjectType()
@Entity('recurring_expenses')
@Index(['schoolId', 'isActive'])
@Index(['schoolId', 'nextDueDate'])
export class RecurringExpense extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column()
  title!: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  categoryId!: string;

  @Field(() => ExpenseCategory, { nullable: true })
  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: ExpenseCategory;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  estimatedAmount!: number;

  @Field(() => RecurringFrequency)
  @Column({
    type: 'enum',
    enum: RecurringFrequency,
    default: RecurringFrequency.MONTHLY,
  })
  frequency!: RecurringFrequency;

  @Field()
  @Column({ type: 'date' })
  nextDueDate!: Date;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  vendorId?: string;

  @Field(() => ExpenseVendor, { nullable: true })
  @ManyToOne(() => ExpenseVendor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: ExpenseVendor;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  lastRecordedDate?: Date;
}
