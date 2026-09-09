import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { NamePrefix, UserRole } from '../../common/enums';

@ObjectType()
@Entity('users')
export class User extends BaseEntity {
  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  email!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone!: string;

  @Field()
  @Column()
  firstName!: string;

  @Field()
  @Column()
  lastName!: string;

  @Field(() => NamePrefix, { nullable: true })
  @Column({ type: 'enum', enum: NamePrefix, nullable: true })
  namePrefix!: NamePrefix | null;

  @Column()
  passwordHash!: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  schoolId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  refreshToken!: string | null;

  @Field({ nullable: true })
  @Column({ nullable: true })
  expoPushToken!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl!: string;

  @Column({ nullable: true })
  avatarPublicId!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true })
  staffId!: string;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires!: Date | null;

  @Field()
  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken!: string | null;

  @Field(() => Int, { nullable: true, defaultValue: 6 })
  @Column({ type: 'int', nullable: true, default: 6 })
  maxPeriodsPerDay?: number;

  @Field(() => Int, { nullable: true, defaultValue: 25 })
  @Column({ type: 'int', nullable: true, default: 25 })
  maxPeriodsPerWeek?: number;

  @Field(() => Boolean, { nullable: true })
  isClassTeacher?: boolean;

  @Field(() => String, { nullable: true })
  assignedClassId?: string;

  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
