import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ClassEntity } from './class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('class_subjects')
export class ClassSubject extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  classId: string;

  @Field()
  @Column({ type: 'uuid' })
  subjectId: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  subjectTeacherId: string;

  @Field(() => ClassEntity)
  @ManyToOne(() => ClassEntity, (c) => c.classSubjects)
  @JoinColumn({ name: 'classId' })
  classEntity: ClassEntity;

  @Field(() => Subject)
  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'subjectTeacherId' })
  subjectTeacher: User;
}
