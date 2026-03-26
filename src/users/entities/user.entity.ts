import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums';

@ObjectType()
@Entity('users')
export class User extends BaseEntity {
  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Column()
  passwordHash: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  expoPushToken: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  avatarPublicId: string;

  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
