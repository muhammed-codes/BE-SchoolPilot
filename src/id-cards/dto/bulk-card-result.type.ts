import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class BulkCardResult {
  @Field(() => Int)
  totalCards: number;

  @Field()
  pdfUrl: string;

  @Field()
  label: string;
}
