import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudentResult } from './student-result.entity';
import { ComponentScore } from '../dto/component-score.type';

@ObjectType()
@Entity('subject_scores')
export class SubjectScore extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  studentResultId: string;

  @Field()
  @Column({ type: 'uuid' })
  subjectId: string;

  @Field()
  @Column({ type: 'uuid' })
  resultSheetId: string;

  @Field(() => [ComponentScore], { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  scores: ComponentScore[];

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  totalScore: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  grade: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  teacherRemark: string;

  @Field()
  @Column({ default: false })
  isSubmitted: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Field()
  @Column({ type: 'uuid' })
  enteredByUserId: string;

  @Field(() => StudentResult)
  @ManyToOne(() => StudentResult, (sr) => sr.subjectScores)
  @JoinColumn({ name: 'studentResultId' })
  studentResult: StudentResult;
}
