import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Student } from './student.entity';
import { User } from '../../users/entities/user.entity';

export enum GuardianRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

registerEnumType(GuardianRelationship, { name: 'GuardianRelationship' });

@ObjectType()
@Entity('student_parents')
@Unique(['studentId', 'parentId'])
export class StudentParent extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  studentId!: string;

  @Field()
  @Column({ type: 'uuid' })
  parentId!: string;

  @Field(() => GuardianRelationship, { nullable: true })
  @Column({
    type: 'enum',
    enum: GuardianRelationship,
    nullable: true,
    default: GuardianRelationship.GUARDIAN,
  })
  relationship!: GuardianRelationship;

  @Field()
  @Column({ default: false })
  isPrimaryContact!: boolean;

  @Field(() => Student)
  @ManyToOne(() => Student, { eager: false })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Field(() => User)
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'parentId' })
  parent!: User;
}
