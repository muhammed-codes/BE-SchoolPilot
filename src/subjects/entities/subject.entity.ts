import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('subjects')
export class Subject extends BaseEntity {
  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;
}
