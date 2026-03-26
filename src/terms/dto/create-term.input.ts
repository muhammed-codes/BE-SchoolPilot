import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';

@InputType()
export class CreateTermInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsUUID()
  sessionId: string;

  @Field()
  @IsNotEmpty()
  startDate: Date;

  @Field()
  @IsNotEmpty()
  endDate: Date;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  totalSchoolDays: number;
}
