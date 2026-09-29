import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ScoringSubject {
  @Field()
  id: string;

  @Field()
  subjectId: string;

  @Field()
  subjectName: string;

  @Field({ nullable: true })
  subjectCode?: string;
}

@ObjectType()
export class TeacherScoringAssignment {
  @Field()
  classId: string;

  @Field()
  className: string;

  @Field()
  hasActiveSheet: boolean;

  @Field({ nullable: true })
  activeSheetId?: string;

  @Field({ nullable: true })
  sheetStatus?: string;

  @Field(() => [ScoringSubject])
  subjects: ScoringSubject[];
}
