import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeesService } from './fees.service';
import { FeesResolver } from './fees.resolver';

import { FeeCategory } from './entities/fee-category.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFeeOverride } from './entities/student-fee-override.entity';
import { SchoolBankAccount } from './entities/school-bank-account.entity';
import { StudentInvoice } from './entities/student-invoice.entity';
import { StudentInvoiceItem } from './entities/student-invoice-item.entity';
import { PaymentSubmissionBatch } from './entities/payment-submission-batch.entity';
import { PaymentSubmissionStudentShare } from './entities/payment-submission-student-share.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { FeeApprovalConfig } from './entities/fee-approval-config.entity';
import { FeeApprovalStep } from './entities/fee-approval-step.entity';
import { PaymentApprovalDecision } from './entities/payment-approval-decision.entity';
import { ReceiptTemplate } from './entities/receipt-template.entity';
import { Receipt } from './entities/receipt.entity';
import { ReceiptSerialSequence } from './entities/receipt-serial-sequence.entity';
import { StaffFeeVisibilityConfig } from './entities/staff-fee-visibility-config.entity';

import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { StudentParent } from '../students/entities/student-parent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeCategory,
      FeeStructure,
      StudentFeeOverride,
      SchoolBankAccount,
      StudentInvoice,
      StudentInvoiceItem,
      PaymentSubmissionBatch,
      PaymentSubmissionStudentShare,
      PaymentAllocation,
      FeeApprovalConfig,
      FeeApprovalStep,
      PaymentApprovalDecision,
      ReceiptTemplate,
      Receipt,
      ReceiptSerialSequence,
      StaffFeeVisibilityConfig,
      Student,
      User,
      StudentParent,
    ]),
  ],
  providers: [FeesService, FeesResolver],
  exports: [FeesService],
})
export class FeesModule {}
