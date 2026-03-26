import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Term } from './term.entity';

@ObjectType()
@Entity('sessions')
export class Session extends BaseEntity {
  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field()
  @Column({ default: false })
  isActive: boolean;

  @Field(() => [Term], { nullable: true })
  @OneToMany(() => Term, (term) => term.session, { eager: false })
  terms: Term[];
}
