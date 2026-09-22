import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AppResource } from '../enums/resource.enum';
import { PermissionAction } from '../enums/permission-action.enum';
import { PermissionEffect } from '../enums/permission-effect.enum';

@ObjectType()
@Entity('user_permissions')
@Unique('UQ_user_permissions', ['userId', 'resource', 'action'])
export class UserPermission extends BaseEntity {
  @Field()
  @Index('IDX_user_permissions_userId')
  @Column({ type: 'uuid' })
  userId!: string;

  @Field()
  @Index('IDX_user_permissions_schoolId')
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => AppResource)
  @Column({ type: 'enum', enum: AppResource })
  resource!: AppResource;

  @Field(() => PermissionAction)
  @Column({ type: 'varchar' })
  action!: PermissionAction;

  @Field(() => PermissionEffect)
  @Column({ type: 'enum', enum: PermissionEffect })
  effect!: PermissionEffect;
}
