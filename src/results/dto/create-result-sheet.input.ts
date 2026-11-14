import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GradingSystem } from '../../common/enums';
import { ScoreComponentConfigInput } from './score-component-config.type';

@InputType()
export class CreateResultSheetInput {
  @Field()
  @IsNotEmpty()
  classId: string;

  @Field()
  @IsNotEmpty()
  termId: string;

  @Field(() => GradingSystem)
  @IsEnum(GradingSystem)
  gradingSystem: GradingSystem;

  @Field(() => [ScoreComponentConfigInput])
  @ValidateNested({ each: true })
  @Type(() => ScoreComponentConfigInput)
  @ArrayMinSize(1)
  scoreComponents: ScoreComponentConfigInput[];
}
