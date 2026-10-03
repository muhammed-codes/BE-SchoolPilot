import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('petty_cash_accounts')
@Index(['schoolId'])
export class PettyCashAccount extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column({ default: 'Main Petty Cash' })
  name!: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingBalance!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentBalance!: number;

  @Field()
  @Column({ default: true })
  isActive!: boolean;
}
