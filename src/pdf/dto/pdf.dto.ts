import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ReportCardItem {
  @Field()
  studentId: string;

  @Field()
  studentName: string;

  @Field()
  pdfUrl: string;
}

@ObjectType()
export class BulkPDFResult {
  @Field(() => Int)
  totalGenerated: number;

  @Field(() => [ReportCardItem])
  reportCards: ReportCardItem[];
}
