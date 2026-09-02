import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ResultStats {
  @Field(() => Int)
  totalSheets: number;

  @Field(() => Int)
  pendingSheets: number;

  @Field(() => Int)
  approvedSheets: number;
}
