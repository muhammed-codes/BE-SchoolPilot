import { ObjectType, InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

@ObjectType()
export class ScoreComponentConfig {
  @Field()
  component: string;

  @Field(() => Float)
  maxScore: number;
}

@InputType()
export class ScoreComponentConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  component: string;

  @Field(() => Float)
  @IsNumber()
  @Min(1)
  maxScore: number;
}
