import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

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
}
