import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('expense_departments')
@Index(['schoolId', 'name'])
export class ExpenseDepartment extends BaseEntity {
  @Field(() => ID)
  @Column({ type: 'uuid' })
  @Index()
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  code?: string;

  @Field()
  @Column({ default: true })
  isActive!: boolean;
}
