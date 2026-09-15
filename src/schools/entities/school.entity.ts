import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('schools')
export class School extends BaseEntity {
  @Field()
  @Column()
  name!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  email!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  logoUrl!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  stampUrl!: string;

  @Column({ nullable: true })
  logoPublicId!: string;

  @Column({ nullable: true })
  stampPublicId!: string;

  @Field()
  @Column({ default: 'basic' })
  schoolType!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  schoolCode!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  defaultReportTemplate!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  schoolStartTime!: string;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  schoolCapacity?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactPersonName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactPersonEmail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactPersonPhone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactPersonRole?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  whatsappNumber?: string;

  @Field({ nullable: true })
  @Column({ default: 'PENDING' })
  verificationStatus?: string;

  @Field()
  @Column({ unique: true })
  uniqueQrCode!: string;
}
