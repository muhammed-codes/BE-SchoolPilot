import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { ComponentScore } from './component-score.type';
import { ScoreComponentConfig } from './score-component-config.type';

@ObjectType()
export class StudentScoreRecord {
  @Field()
  id: string;

  @Field()
  studentId: string;

  @Field()
  studentName: string;

  @Field({ nullable: true })
  admissionNumber?: string;

  @Field({ nullable: true })
  passportPhotoUrl?: string;

  @Field({ nullable: true })
  gender?: string;

  @Field()
  classId: string;

  @Field()
  className: string;

  @Field({ nullable: true })
  subjectId?: string;

  @Field({ nullable: true })
  subjectName?: string;

  @Field(() => [ComponentScore], { nullable: true })
  componentScores?: ComponentScore[];

  @Field(() => Float, { nullable: true })
  ca1?: number;

  @Field(() => Float, { nullable: true })
  ca2?: number;

  @Field(() => Float, { nullable: true })
  exam?: number;

  @Field(() => Float)
  totalScore: number;

  @Field(() => Float, { nullable: true })
  maxScore?: number;

  @Field(() => Float, { nullable: true })
  percentage?: number;

  @Field(() => Int, { nullable: true })
  subjectCount?: number;

  @Field({ nullable: true })
  grade?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field({ nullable: true })
  teacherRemark?: string;

  @Field()
  resultSheetId: string;

  @Field()
  resultSheetStatus: string;
}

@ObjectType()
export class PaginatedClassScores {
  @Field(() => [StudentScoreRecord])
  items: StudentScoreRecord[];

  @Field(() => Int)
  total: number;

  @Field(() => Boolean)
  hasMore: boolean;

  @Field(() => [ScoreComponentConfig], { nullable: true })
  scoreComponents?: ScoreComponentConfig[];

  @Field(() => Float, { nullable: true })
  maxScore?: number;
}
