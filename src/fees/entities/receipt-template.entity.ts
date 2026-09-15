import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('receipt_templates')
@Index(['schoolId'])
export class ReceiptTemplate extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  thumbnailUrl!: string | null;

  /** Maps to a template file key — same pattern as report-card-template */
  @Field()
  @Column()
  templateKey!: string;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field()
  @Column({ default: false })
  isDefault!: boolean;
}
