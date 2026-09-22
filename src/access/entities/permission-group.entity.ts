import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('permission_groups')
@Unique('UQ_permission_groups_school_name', ['schoolId', 'name'])
export class PermissionGroup extends BaseEntity {
  @Field()
  @Index('IDX_permission_groups_schoolId')
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Field()
  @Column({ default: true })
  isActive!: boolean;
}
