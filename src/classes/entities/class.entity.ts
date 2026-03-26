import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ClassSubject } from './class-subject.entity';

@ObjectType()
@Entity('classes')
export class ClassEntity extends BaseEntity {
  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  classTeacherId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'classTeacherId' })
  classTeacher: User;

  @Field(() => [ClassSubject], { nullable: true })
  @OneToMany(() => ClassSubject, (cs) => cs.classEntity, { eager: false })
  classSubjects: ClassSubject[];
}
