import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';
import {
  StudentInvoice,
  InvoiceStatus,
} from '../entities/student-invoice.entity';

@ObjectType()
export class StudentFeeLedgerItem {
  @Field()
  id!: string;

  @Field()
  studentInvoiceId!: string;

  @Field()
  feeCategoryId!: string;

  @Field()
  description!: string;

  @Field(() => Int)
  amount!: number;

  @Field(() => Int)
  amountPaid!: number;

  @Field(() => Int)
  balance!: number;

  @Field(() => Int, { defaultValue: 0 })
  originalAmount!: number;

  @Field(() => Int, { defaultValue: 0 })
  discountAmount!: number;

  @Field(() => Boolean, { defaultValue: false })
  hasDiscount!: boolean;

  @Field(() => String, { nullable: true })
  discountType?: string;

  @Field(() => String, { nullable: true })
  discountReason?: string;
}

@ObjectType()
export class ClassFeeSummary {
  @Field()
  classId!: string;

  @Field()
  className!: string;

  @Field(() => Int)
  totalStudents!: number;

  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalPaid!: number;

  @Field(() => Int)
  totalOutstanding!: number;

  @Field(() => Int, { defaultValue: 0 })
  totalDiscounts!: number;

  @Field(() => Int)
  paidCount!: number;

  @Field(() => Int)
  partiallyPaidCount!: number;

  @Field(() => Int)
  openCount!: number;
}

@ObjectType()
export class FeeOverview {
  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalCollected!: number;

  @Field(() => Int)
  totalOutstanding!: number;

  @Field(() => Int, { defaultValue: 0 })
  totalDiscounts!: number;

  @Field(() => Int)
  paidInvoicesCount!: number;

  @Field(() => Int)
  partiallyPaidInvoicesCount!: number;

  @Field(() => Int)
  openInvoicesCount!: number;

  @Field(() => [ClassFeeSummary])
  classSummaries!: ClassFeeSummary[];
}

@ObjectType()
export class StudentFeeLedger {
  @Field()
  studentId!: string;

  @Field(() => Student, { nullable: true })
  student?: Student;

  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalPaid!: number;

  @Field(() => Int)
  balance!: number;

  @Field(() => Int, { defaultValue: 0 })
  totalOriginalBilled!: number;

  @Field(() => Int, { defaultValue: 0 })
  totalDiscount!: number;

  @Field(() => Boolean, { defaultValue: false })
  hasDiscount!: boolean;

  @Field(() => String, { nullable: true })
  discountType?: string;

  @Field(() => String, { nullable: true })
  discountReason?: string;

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus;

  @Field({ nullable: true })
  dueDate?: string;

  @Field(() => [StudentInvoice])
  invoices!: StudentInvoice[];

  @Field(() => [StudentFeeLedgerItem])
  items!: StudentFeeLedgerItem[];
}

@ObjectType()
export class ClassFeeLedger {
  @Field()
  classId!: string;

  @Field()
  className!: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  termId?: string;

  @Field(() => Int)
  totalStudents!: number;

  @Field(() => Int)
  totalBilled!: number;

  @Field(() => Int)
  totalPaid!: number;

  @Field(() => Int)
  totalBalance!: number;

  @Field(() => Int, { defaultValue: 0 })
  totalDiscounts!: number;

  @Field(() => Int, { defaultValue: 0 })
  discountedStudentsCount!: number;

  @Field(() => Int)
  paidCount!: number;

  @Field(() => Int)
  partialCount!: number;

  @Field(() => Int)
  partiallyPaidCount!: number;

  @Field(() => Int)
  openCount!: number;

  @Field(() => Float, { nullable: true })
  collectionRate?: number;

  @Field(() => [StudentFeeLedger])
  studentLedgers!: StudentFeeLedger[];
}
