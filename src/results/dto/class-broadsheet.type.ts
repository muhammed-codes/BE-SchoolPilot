import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ComponentScore } from './component-score.type';
import { ScoreComponentConfig } from './score-component-config.type';

@ObjectType()
export class ClassBroadsheetSubjectScore {
  @Field() subjectId!: string;
  @Field() subjectName!: string;
  @Field(() => [ComponentScore], { nullable: true }) scores?: ComponentScore[];
  @Field(() => Float, { nullable: true }) totalScore?: number;
  @Field({ nullable: true }) grade?: string;
}

@ObjectType()
export class ClassBroadsheetStudent {
  @Field() studentId!: string;
  @Field() studentName!: string;
  @Field({ nullable: true }) admissionNumber?: string;
  @Field(() => [ClassBroadsheetSubjectScore]) subjects!: ClassBroadsheetSubjectScore[];
  @Field(() => Float, { nullable: true }) totalScore?: number;
  @Field(() => Float, { nullable: true }) maxScore?: number;
  @Field({ nullable: true }) grade?: string;
}

@ObjectType()
export class ClassBroadsheetSubject {
  @Field() subjectId!: string;
  @Field() subjectName!: string;
  @Field(() => [ScoreComponentConfig]) scoreComponents!: ScoreComponentConfig[];
}

@ObjectType()
export class ClassBroadsheetPage {
  @Field(() => [ClassBroadsheetStudent]) items!: ClassBroadsheetStudent[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => [ClassBroadsheetSubject]) subjects!: ClassBroadsheetSubject[];
}
