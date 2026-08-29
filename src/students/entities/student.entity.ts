import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Gender, StudentStatus } from '../../common/enums';
import { ClassEntity } from '../../classes/entities/class.entity';

@ObjectType()
@Entity('students')
@Unique(['admissionNumber', 'schoolId'])
export class Student extends BaseEntity {
  @Field()
  @Column()
  firstName!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  middleName?: string;

  @Field()
  @Column()
  lastName!: string;

  @Field()
  @Column()
  admissionNumber!: string;

  @Field({ nullable: true })
  @Column({
    type: 'date',
    nullable: true,
  })
  dateOfBirth?: string;

  @Field(() => Gender)
  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Field()
  @Column({ default: 'Nigerian' })
  nationality!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  stateOfOrigin?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lga?: string;

  @Field(() => StudentStatus)
  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status!: StudentStatus;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  dateOfAdmission?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passportPhotoUrl?: string;

  @Column({ nullable: true })
  passportPhotoPublicId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  medicalInfo?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ default: false })
  isArchived!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  admissionClassId?: string;

  @Field(() => ClassEntity, { nullable: true })
  @ManyToOne(() => ClassEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'admissionClassId' })
  admissionClass?: ClassEntity;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  currentClassId!: string;

  @Field(() => ClassEntity, { nullable: true })
  @ManyToOne(() => ClassEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currentClassId' })
  currentClass!: ClassEntity;

  @Field()
  get fullName(): string {
    return [this.firstName, this.middleName, this.lastName]
      .filter(Boolean)
      .join(' ');
  }
}
