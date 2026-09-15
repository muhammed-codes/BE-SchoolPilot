import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeeCategory } from './fee-category.entity';

@ObjectType()
@Entity('school_bank_accounts')
@Index(['schoolId'])
export class SchoolBankAccount extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  bankName!: string;

  @Field()
  @Column()
  accountNumber!: string;

  @Field()
  @Column()
  accountName!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  feeCategoryId!: string | null;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Field(() => FeeCategory, { nullable: true })
  @ManyToOne(() => FeeCategory, { eager: false, nullable: true })
  @JoinColumn({ name: 'feeCategoryId' })
  feeCategory!: FeeCategory | null;
}
