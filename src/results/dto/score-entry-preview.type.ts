import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { StudentScoreInput } from './save-subject-scores.input';

@InputType()
export class PreviewSubjectScoresInput {
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
}

@ObjectType()
export class StudentScoreTotalPreview {
  @Field()
  studentId: string;

  @Field(() => Float)
  totalScore: number;
}

@ObjectType()
export class SubjectScoreEntryPreview {
  @Field(() => Float)
  maxTotalScore: number;

  @Field(() => [StudentScoreTotalPreview])
  students: StudentScoreTotalPreview[];
}
