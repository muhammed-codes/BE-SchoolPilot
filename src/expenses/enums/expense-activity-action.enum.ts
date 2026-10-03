import { registerEnumType } from '@nestjs/graphql';

export enum ExpenseActivityAction {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FUNDED = 'FUNDED',
  CONVERTED_TO_EXPENSE = 'CONVERTED_TO_EXPENSE',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',
  VOIDED = 'VOIDED',
  UPDATED = 'UPDATED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(ExpenseActivityAction, { name: 'ExpenseActivityAction' });
