import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TermStatus } from '../../common/enums';
import { Session } from './session.entity';

@ObjectType()
@Entity('terms')
export class Term extends BaseEntity {
  private static readonly DAY_IN_MS = 24 * 60 * 60 * 1000;

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

  private normalizeToUtcDateOnly(value: Date | string): Date {
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  @Field(() => Int)
  get totalWeeks(): number {
    const start = this.normalizeToUtcDateOnly(this.startDate);
    const end = this.normalizeToUtcDateOnly(this.endDate);

    if (end < start) return 0;

    const daysInclusive =
      Math.floor((end.getTime() - start.getTime()) / Term.DAY_IN_MS) + 1;
    return Math.ceil(daysInclusive / 7);
  }

  @Field(() => Int)
  get currentWeek(): number {
    const start = this.normalizeToUtcDateOnly(this.startDate);
    const end = this.normalizeToUtcDateOnly(this.endDate);

    if (end < start) return 0;

    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    if (todayUtc < start) return 0;
    if (todayUtc > end) return this.totalWeeks;

    const elapsedDays =
      Math.floor((todayUtc.getTime() - start.getTime()) / Term.DAY_IN_MS) + 1;

    return Math.min(this.totalWeeks, Math.ceil(elapsedDays / 7));
  }

  @Field(() => Session)
  @ManyToOne(() => Session, (session) => session.terms)
  @JoinColumn({ name: 'sessionId' })
  session: Session;
}
