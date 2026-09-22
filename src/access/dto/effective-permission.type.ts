import { ObjectType, Field } from '@nestjs/graphql';
import { AppResource } from '../enums/resource.enum';
import { PermissionAction } from '../enums/permission-action.enum';

@ObjectType()
export class EffectivePermission {
  @Field(() => AppResource)
  resource!: AppResource;

  @Field(() => PermissionAction)
  action!: PermissionAction;

  @Field()
  allowed!: boolean;
}
