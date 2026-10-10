import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { IdCardType, IdCardOrientation } from '../enums/id-card.enums';

@ObjectType()
@Entity('id_card_templates')
export class IdCardTemplate extends BaseEntity {
  @Field()
  @Column({ unique: true })
  key!: string;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column({ type: 'text' })
  description!: string;

  @Field(() => IdCardType)
  @Column({
    type: 'enum',
    enum: IdCardType,
    default: IdCardType.STUDENT,
  })
  cardType!: IdCardType;

  @Field(() => IdCardOrientation)
  @Column({
    type: 'enum',
    enum: IdCardOrientation,
    default: IdCardOrientation.PORTRAIT,
  })
  orientation!: IdCardOrientation;

  @Field(() => Float)
  @Column({ type: 'float', default: 53.98 })
  widthMm!: number;

  @Field(() => Float)
  @Column({ type: 'float', default: 85.6 })
  heightMm!: number;

  @Field()
  @Column({ default: '1.0.0' })
  version!: string;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field()
  @Column({ default: false })
  isSystemDefault!: boolean;

  @Field()
  @Column({ default: true })
  hasBackSide!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  previewThumbnailUrl!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  designConfiguration!: string | null;
}
