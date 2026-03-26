import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PromotionResult {
  @Field(() => Int)
  promoted: number;

  @Field(() => Int)
  archived: number;
}
