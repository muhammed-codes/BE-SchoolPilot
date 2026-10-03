import { registerEnumType } from '@nestjs/graphql';

export enum ExpensePaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  POS = 'POS',
  PETTY_CASH = 'PETTY_CASH',
}

registerEnumType(ExpensePaymentMethod, { name: 'ExpensePaymentMethod' });
