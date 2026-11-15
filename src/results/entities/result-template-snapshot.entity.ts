import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GraphQLJSONObject } from '../../common/scalars/json-object.scalar';
import { ResultTemplateConfig } from '../templates/result-template-config.interface';

@ObjectType()
@Entity('result_template_snapshots')
export class ResultTemplateSnapshot extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  templateId!: string;

  @Field()
  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  version!: number;

  @Field(() => GraphQLJSONObject)
  @Column({ type: 'jsonb' })
  config!: ResultTemplateConfig;
}
