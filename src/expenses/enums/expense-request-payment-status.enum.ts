import { registerEnumType } from '@nestjs/graphql';

export enum ExpenseRequestPaymentStatus {
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  UNPAID = 'UNPAID',
}

registerEnumType(ExpenseRequestPaymentStatus, {
  name: 'ExpenseRequestPaymentStatus',
});
