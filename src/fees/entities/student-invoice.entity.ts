import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, Index, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudentInvoiceItem } from './student-invoice-item.entity';

export enum InvoiceStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

registerEnumType(InvoiceStatus, { name: 'InvoiceStatus' });

@ObjectType()
@Entity('student_invoices')
@Index(['schoolId'])
@Index(['studentId'])
@Index(['status'])
@Unique(['studentId', 'sessionId', 'termId'])
export class StudentInvoice extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  studentId!: string;

  @Field()
  @Column({ type: 'uuid' })
  sessionId!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  termId!: string | null;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  totalAmount!: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  totalPaid!: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  balance!: number;

  @Field(() => InvoiceStatus)
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status!: InvoiceStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'date', nullable: true })
  dueDate!: string | null;

  @Field()
  @Column({ type: 'timestamp', default: () => 'now()' })
  generatedAt!: Date;

  @Field(() => [StudentInvoiceItem], { nullable: true })
  @OneToMany(() => StudentInvoiceItem, (item) => item.invoice, { eager: false })
  items!: StudentInvoiceItem[];
}
