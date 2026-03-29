import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TermStatus } from '../../common/enums';
import { Session } from './session.entity';

@ObjectType()
@Entity('terms')
export class Term extends BaseEntity {
  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'uuid' })
  sessionId: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field(() => String)
  @Column({ type: 'date' })
  startDate: Date;

  @Field(() => String)
  @Column({ type: 'date' })
  endDate: Date;

  @Field(() => TermStatus)
  @Column({ type: 'enum', enum: TermStatus, default: TermStatus.CLOSED })
  status: TermStatus;

  @Field(() => Int)
  @Column({ default: 0 })
  totalSchoolDays: number;

  @Field(() => Session)
  @ManyToOne(() => Session, (session) => session.terms)
  @JoinColumn({ name: 'sessionId' })
  session: Session;
}
