import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/role.enum';
import { AppResource } from '../enums/resource.enum';

@ObjectType()
@Entity('role_permissions')
@Unique(['role', 'resource'])
export class RolePermission extends BaseEntity {
  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Field(() => AppResource)
  @Column({ type: 'enum', enum: AppResource })
  resource!: AppResource;

  @Field()
  @Column({ default: false })
  canCreate!: boolean;

  @Field()
  @Column({ default: false })
  canRead!: boolean;

  @Field()
  @Column({ default: false })
  canUpdate!: boolean;

  @Field()
  @Column({ default: false })
  canDelete!: boolean;
}
