import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ResultSheet } from './result-sheet.entity';
import { SubjectScore } from './subject-score.entity';
import { ComponentScore } from '../dto/component-score.type';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
@Entity('student_results')
export class StudentResult extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  resultSheetId!: string;

  @Field()
  @Column({ type: 'uuid' })
  studentId!: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => [ComponentScore], { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  scores!: ComponentScore[];

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  totalScore!: number;

  @Field(() => Float, { nullable: true })
  percentage?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  grade!: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  position!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  classTeacherRemark!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  principalRemark!: string;

  @Field(() => ResultSheet)
  @ManyToOne(() => ResultSheet, (rs) => rs.studentResults)
  @JoinColumn({ name: 'resultSheetId' })
  resultSheet!: ResultSheet;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, { nullable: true, eager: false })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Field(() => [SubjectScore], { nullable: true })
  @OneToMany(() => SubjectScore, (ss) => ss.studentResult, { eager: false })
  subjectScores!: SubjectScore[];

  @Field(() => Float, { nullable: true })
  get ca1(): number | undefined {
    if (this.scores?.length) {
      const match = this.scores.find((s) => (s.component as any) === 'CA1' || (s.component as any) === '1st CA');
      if (match !== undefined) return match.score;
    }
    if (this.subjectScores?.length) {
      for (const ss of this.subjectScores) {
        const match = ss.scores?.find((s) => (s.component as any) === 'CA1' || (s.component as any) === '1st CA');
        if (match !== undefined) return match.score;
      }
    }
    return undefined;
  }

  @Field(() => Float, { nullable: true })
  get ca2(): number | undefined {
    if (this.scores?.length) {
      const match = this.scores.find((s) => (s.component as any) === 'CA2' || (s.component as any) === '2nd CA');
      if (match !== undefined) return match.score;
    }
    if (this.subjectScores?.length) {
      for (const ss of this.subjectScores) {
        const match = ss.scores?.find((s) => (s.component as any) === 'CA2' || (s.component as any) === '2nd CA');
        if (match !== undefined) return match.score;
      }
    }
    return undefined;
  }

  @Field(() => Float, { nullable: true })
  get exam(): number | undefined {
    if (this.scores?.length) {
      const match = this.scores.find((s) => (s.component as any) === 'EXAM' || (s.component as any) === 'Examination');
      if (match !== undefined) return match.score;
    }
    if (this.subjectScores?.length) {
      for (const ss of this.subjectScores) {
        const match = ss.scores?.find((s) => (s.component as any) === 'EXAM' || (s.component as any) === 'Examination');
        if (match !== undefined) return match.score;
      }
    }
    return undefined;
  }
}
