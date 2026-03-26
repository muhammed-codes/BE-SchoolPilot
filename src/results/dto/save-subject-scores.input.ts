import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentScoreInput } from './component-score.type';

@InputType()
export class StudentScoreInput {
  @Field()
  @IsNotEmpty()
  studentId: string;

  @Field(() => [ComponentScoreInput])
  @ValidateNested({ each: true })
  @Type(() => ComponentScoreInput)
  @ArrayMinSize(1)
  componentScores: ComponentScoreInput[];
}

@InputType()
export class SaveSubjectScoresInput {
  @Field()
  @IsNotEmpty()
  resultSheetId: string;

  @Field()
  @IsNotEmpty()
  subjectId: string;

  @Field(() => [StudentScoreInput])
  @ValidateNested({ each: true })
  @Type(() => StudentScoreInput)
  @ArrayMinSize(1)
  scores: StudentScoreInput[];

  @Field()
  @IsBoolean()
  submit: boolean;
}
