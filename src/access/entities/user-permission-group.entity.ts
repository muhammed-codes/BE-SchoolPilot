import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('user_permission_groups')
@Unique('UQ_user_permission_groups', ['userId', 'groupId'])
export class UserPermissionGroup extends BaseEntity {
  @Field()
  @Index('IDX_user_permission_groups_userId')
  @Column({ type: 'uuid' })
  userId!: string;

  @Field()
  @Index('IDX_user_permission_groups_groupId')
  @Column({ type: 'uuid' })
  groupId!: string;

  @Field()
  @Index('IDX_user_permission_groups_schoolId')
  @Column({ type: 'uuid' })
  schoolId!: string;
}
