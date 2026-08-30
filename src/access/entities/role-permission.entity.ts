import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/role.enum';
import { AppResource } from '../enums/resource.enum';

@ObjectType()
@Entity('role_permissions')
@Unique('UQ_role_permissions_scoped', ['role', 'resource', 'schoolId'])
export class RolePermission extends BaseEntity {
  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Field(() => AppResource)
  @Column({ type: 'enum', enum: AppResource })
  resource!: AppResource;

  /**
   * The school this permission row belongs to.
   * NULL means it is a global fallback (used only for SUPER_ADMIN rows that have no school).
   * All other roles must have a non-null schoolId.
   */
  @Field(() => String, { nullable: true })
  @Index('IDX_role_permissions_schoolId')
  @Column({ type: 'uuid', nullable: true })
  schoolId!: string | null;

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
