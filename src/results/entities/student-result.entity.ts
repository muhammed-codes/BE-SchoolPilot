import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ResultSheet } from './result-sheet.entity';
import { SubjectScore } from './subject-score.entity';
import { ComponentScore } from '../dto/component-score.type';

@ObjectType()
@Entity('student_results')
export class StudentResult extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  resultSheetId: string;

  @Field()
  @Column({ type: 'uuid' })
  studentId: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field(() => [ComponentScore], { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  scores: ComponentScore[];

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  totalScore: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  grade: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  position: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  classTeacherRemark: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  principalRemark: string;

  @Field(() => ResultSheet)
  @ManyToOne(() => ResultSheet, (rs) => rs.studentResults)
  @JoinColumn({ name: 'resultSheetId' })
  resultSheet: ResultSheet;

  @Field(() => [SubjectScore], { nullable: true })
  @OneToMany(() => SubjectScore, (ss) => ss.studentResult, { eager: false })
  subjectScores: SubjectScore[];
}
