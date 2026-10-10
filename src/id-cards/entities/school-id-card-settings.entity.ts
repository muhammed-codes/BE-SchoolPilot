import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { IdCardTemplate } from './id-card-template.entity';

@ObjectType()
@Entity('school_id_card_settings')
@Index(['schoolId'], { unique: true })
export class SchoolIdCardSettings extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  defaultStudentTemplateId!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  defaultStaffTemplateId!: string | null;

  @Field(() => IdCardTemplate, { nullable: true })
  defaultStudentTemplate?: IdCardTemplate | null;

  @Field(() => IdCardTemplate, { nullable: true })
  defaultStaffTemplate?: IdCardTemplate | null;

  @Field()
  @Column({ default: true })
  showQrCode!: boolean;

  @Field()
  @Column({ default: true })
  showSchoolAddress!: boolean;

  @Field()
  @Column({ default: false })
  showPrincipalSignature!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  customNote!: string | null;
}
