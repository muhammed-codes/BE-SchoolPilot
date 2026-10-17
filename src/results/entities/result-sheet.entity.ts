import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GradingSystem, ResultStatus } from '../../common/enums';
import { ScoreComponentConfig } from '../dto/score-component-config.type';
import { StudentResult } from './student-result.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Term } from '../../terms/entities/term.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('result_sheets')
export class ResultSheet extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  classId!: string;

  @Field(() => ClassEntity, { nullable: true })
  @ManyToOne(() => ClassEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'classId' })
  classEntity!: ClassEntity;

  @Field()
  @Column({ type: 'uuid' })
  termId!: string;

  @Field(() => Term, { nullable: true })
  @ManyToOne(() => Term, { nullable: true, eager: false })
  @JoinColumn({ name: 'termId' })
  term!: Term;

  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId!: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: User;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  approvedByUserId!: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'approvedByUserId' })
  approvedByUser!: User | null;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Field(() => GradingSystem)
  @Column({ type: 'enum', enum: GradingSystem })
  gradingSystem!: GradingSystem;

  @Field(() => [ScoreComponentConfig])
  @Column({ type: 'jsonb' })
  scoreComponents!: ScoreComponentConfig[];

  @Field(() => ResultStatus)
  @Column({ type: 'enum', enum: ResultStatus, default: ResultStatus.DRAFT })
  status!: ResultStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  returnReason!: string;

  @Field({ defaultValue: false })
  @Column({ default: false })
  isArchived!: boolean;

  @Field(() => [StudentResult], { nullable: true })
  @OneToMany(() => StudentResult, (sr) => sr.resultSheet, { eager: false })
  studentResults!: StudentResult[];

  @Field(() => [StudentResult], { nullable: true })
  get results(): StudentResult[] | undefined {
    return this.studentResults;
  }
}
