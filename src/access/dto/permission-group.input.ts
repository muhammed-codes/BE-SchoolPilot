import { Field, InputType } from '@nestjs/graphql';
import { AppResource } from '../enums/resource.enum';
import { PermissionAction } from '../enums/permission-action.enum';
import { PermissionEffect } from '../enums/permission-effect.enum';

@InputType()
export class CreatePermissionGroupInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  schoolId?: string;
}

@InputType()
export class UpdatePermissionGroupInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class PermissionAssignmentInput {
  @Field(() => AppResource)
  resource!: AppResource;

  @Field(() => PermissionAction)
  action!: PermissionAction;
}

@InputType()
export class SetPermissionGroupPermissionsInput {
  @Field()
  groupId!: string;

  @Field(() => [PermissionAssignmentInput])
  permissions!: PermissionAssignmentInput[];
}

@InputType()
export class AssignPermissionGroupInput {
  @Field()
  userId!: string;

  @Field()
  groupId!: string;
}

@InputType()
export class SetUserPermissionInput {
  @Field()
  userId!: string;

  @Field(() => AppResource)
  resource!: AppResource;

  @Field(() => PermissionAction)
  action!: PermissionAction;

  @Field(() => PermissionEffect)
  effect!: PermissionEffect;
}
