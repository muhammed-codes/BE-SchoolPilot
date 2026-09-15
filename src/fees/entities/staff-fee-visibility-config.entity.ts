import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('staff_fee_visibility_configs')
@Index(['schoolId'])
@Unique(['schoolId', 'role'])
export class StaffFeeVisibilityConfig extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  role!: string;

  @Field()
  @Column({ default: false })
  canViewPaymentRecords!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  updatedBy!: string | null;
}
