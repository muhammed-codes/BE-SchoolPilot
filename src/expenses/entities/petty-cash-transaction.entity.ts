import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PettyCashTransactionType } from '../enums';
import { PettyCashAccount } from './petty-cash-account.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('petty_cash_transactions')
@Index(['schoolId', 'accountId'])
@Index(['schoolId', 'createdAt'])
export class PettyCashTransaction extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  accountId!: string;

  @Field(() => PettyCashAccount, { nullable: true })
  @ManyToOne(() => PettyCashAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: PettyCashAccount;

  @Field(() => PettyCashTransactionType)
  @Column({
    type: 'enum',
    enum: PettyCashTransactionType,
  })
  type!: PettyCashTransactionType;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter!: number;

  @Field()
  @Column()
  description!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  referenceId?: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  recordedById!: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy?: User;
}
