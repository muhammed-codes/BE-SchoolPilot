import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SchoolAdminAccount {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  isActive: boolean;
}
