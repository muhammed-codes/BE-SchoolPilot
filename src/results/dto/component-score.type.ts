import { ObjectType, InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

@ObjectType()
export class ComponentScore {
  @Field()
  component: string;

  @Field(() => Float)
  score: number;
}

@InputType()
export class ComponentScoreInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  component: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  score: number;
}
