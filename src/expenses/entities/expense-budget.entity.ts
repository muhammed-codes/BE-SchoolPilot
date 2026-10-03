import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpenseCategory } from './expense-category.entity';
import { Session } from '../../terms/entities/session.entity';
import { Term } from '../../terms/entities/term.entity';

@ObjectType()
@Entity('expense_budgets')
@Index(['schoolId', 'sessionId', 'termId', 'categoryId'], { unique: true })
export class ExpenseBudget extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  sessionId!: string;

  @Field(() => Session, { nullable: true })
  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session?: Session;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  termId?: string;

  @Field(() => Term, { nullable: true })
  @ManyToOne(() => Term, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'termId' })
  term?: Term;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  categoryId!: string;

  @Field(() => ExpenseCategory, { nullable: true })
  @ManyToOne(() => ExpenseCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: ExpenseCategory;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budgetAmount!: number;
}
