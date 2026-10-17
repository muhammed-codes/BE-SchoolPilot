import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SchoolTypeOption {
  @Field()
  value: string;

  @Field()
  label: string;

  @Field()
  description: string;
}
