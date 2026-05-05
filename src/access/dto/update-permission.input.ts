import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdatePermissionInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  canCreate?: boolean;

  @Field({ nullable: true })
  canRead?: boolean;

  @Field({ nullable: true })
  canUpdate?: boolean;

  @Field({ nullable: true })
  canDelete?: boolean;
}
