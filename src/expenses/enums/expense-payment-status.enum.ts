import { registerEnumType } from '@nestjs/graphql';

export enum ExpensePaymentStatus {
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  UNPAID = 'UNPAID',
  VOIDED = 'VOIDED',
}

registerEnumType(ExpensePaymentStatus, { name: 'ExpensePaymentStatus' });
