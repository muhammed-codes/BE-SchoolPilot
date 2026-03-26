import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Student } from '../entities/student.entity';

@ObjectType()
export class FailedRow {
  @Field(() => Int)
  row: number;

  @Field()
  reason: string;
}

@ObjectType()
export class BulkImportResult {
  @Field(() => Int)
  imported: number;

  @Field(() => [FailedRow])
  failed: FailedRow[];

  @Field(() => [Student])
  students: Student[];
}
