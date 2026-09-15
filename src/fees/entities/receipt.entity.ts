import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ReceiptTemplate } from './receipt-template.entity';

@ObjectType()
@Entity('receipts')
export class Receipt extends BaseEntity {
  @Field()
  @Column({ type: 'uuid', unique: true })
  studentShareId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  templateId!: string | null;

  @Field()
  @Column()
  serialNumber!: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'now()' })
  generatedAt!: Date;

  @Field(() => ReceiptTemplate, { nullable: true })
  @ManyToOne(() => ReceiptTemplate, { eager: false, nullable: true })
  @JoinColumn({ name: 'templateId' })
  template!: ReceiptTemplate | null;
}
