import { ObjectType, InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { ScoreComponent } from '../../common/enums';

@ObjectType()
export class ScoreComponentConfig {
  @Field(() => ScoreComponent)
  component: ScoreComponent;

  @Field(() => Float)
  maxScore: number;
}

@InputType()
export class ScoreComponentConfigInput {
  @Field(() => ScoreComponent)
  @IsEnum(ScoreComponent)
  component: ScoreComponent;

  @Field(() => Float)
  @IsNumber()
  @Min(1)
  maxScore: number;
}
