import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AppResource } from '../enums/resource.enum';
import { PermissionAction } from '../enums/permission-action.enum';

@ObjectType()
@Entity('permission_group_permissions')
@Unique('UQ_permission_group_permissions', ['groupId', 'resource', 'action'])
export class PermissionGroupPermission extends BaseEntity {
  @Field()
  @Index('IDX_permission_group_permissions_groupId')
  @Column({ type: 'uuid' })
  groupId!: string;

  @Field()
  @Index('IDX_permission_group_permissions_schoolId')
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => AppResource)
  @Column({ type: 'enum', enum: AppResource })
  resource!: AppResource;

  @Field(() => PermissionAction)
  @Column({ type: 'varchar' })
  action!: PermissionAction;
}
