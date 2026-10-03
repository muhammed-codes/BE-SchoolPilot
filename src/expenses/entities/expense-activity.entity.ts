import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpenseActivityAction } from '../enums';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('expense_activities')
@Index(['schoolId', 'entityType', 'entityId'])
@Index(['schoolId', 'createdAt'])
export class ExpenseActivity extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column()
  entityType!: string; // 'EXPENSE' | 'REQUEST' | 'BUDGET' | 'PETTY_CASH'

  @Field(() => ID)
  @Column({ type: 'uuid' })
  entityId!: string;

  @Field(() => ExpenseActivityAction)
  @Column({
    type: 'enum',
    enum: ExpenseActivityAction,
  })
  action!: ExpenseActivityAction;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  actorId!: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string;
}
