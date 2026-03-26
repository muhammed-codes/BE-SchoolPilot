import { ObjectType, InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { ScoreComponent } from '../../common/enums';

@ObjectType()
export class ComponentScore {
  @Field(() => ScoreComponent)
  component: ScoreComponent;

  @Field(() => Float)
  score: number;
}

@InputType()
export class ComponentScoreInput {
  @Field(() => ScoreComponent)
  @IsEnum(ScoreComponent)
  component: ScoreComponent;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  score: number;
}
