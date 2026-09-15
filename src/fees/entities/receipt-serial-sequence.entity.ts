import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@ObjectType()
@Entity('receipt_serial_sequences')
@Unique(['schoolId'])
export class ReceiptSerialSequence extends BaseEntity {
  @Field()
  @Column({ type: 'uuid', unique: true })
  schoolId!: string;

  @Field()
  @Column({ default: 'RCP' })
  prefix!: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  lastSequence!: number;
}
