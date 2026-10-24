import { Field, InputType } from '@nestjs/graphql';
import { Allow } from 'class-validator';
import { AppResource } from '../enums/resource.enum';
import { PermissionAction } from '../enums/permission-action.enum';
import { PermissionEffect } from '../enums/permission-effect.enum';

@InputType()
export class CreatePermissionGroupInput {
  @Field()
  @Allow()
  name!: string;

  @Field({ nullable: true })
  @Allow()
  description?: string;

  @Field({ nullable: true })
  @Allow()
  schoolId?: string;
}

@InputType()
export class UpdatePermissionGroupInput {
  @Field()
  @Allow()
  id!: string;

  @Field({ nullable: true })
  @Allow()
  name?: string;

  @Field({ nullable: true })
  @Allow()
  description?: string;

  @Field({ nullable: true })
  @Allow()
  isActive?: boolean;
}

@InputType()
export class PermissionAssignmentInput {
  @Field(() => AppResource)
  @Allow()
  resource!: AppResource;

  @Field(() => PermissionAction)
  @Allow()
  action!: PermissionAction;
}

@InputType()
export class SetPermissionGroupPermissionsInput {
  @Field()
  @Allow()
  groupId!: string;

  @Field(() => [PermissionAssignmentInput])
  @Allow()
  permissions!: PermissionAssignmentInput[];
}

@InputType()
export class AssignPermissionGroupInput {
  @Field()
  @Allow()
  userId!: string;

  @Field()
  @Allow()
  groupId!: string;
}

@InputType()
export class SetUserPermissionInput {
  @Field()
  @Allow()
  userId!: string;

  @Field(() => AppResource)
  @Allow()
  resource!: AppResource;

  @Field(() => PermissionAction)
  @Allow()
  action!: PermissionAction;

  @Field(() => PermissionEffect)
  @Allow()
  effect!: PermissionEffect;
}
