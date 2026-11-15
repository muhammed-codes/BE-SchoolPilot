import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GraphQLJSONObject } from '../../common/scalars/json-object.scalar';
import { ResultTemplateConfig } from '../templates/result-template-config.interface';

@ObjectType()
@Entity('result_templates')
export class ResultTemplate extends BaseEntity {
  @Field()
  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'varchar' })
  name!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  version!: number;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Field(() => [String])
  @Column({ type: 'uuid', array: true, default: '{}' })
  assignedClassIds!: string[];

  @Field(() => GraphQLJSONObject)
  @Column({ type: 'jsonb' })
  config!: ResultTemplateConfig;
}
