import { registerEnumType } from '@nestjs/graphql';

export enum ExpenseRequestType {
  MATERIALS_PURCHASE = 'MATERIALS_PURCHASE',
  PROJECT_ACTIVITY = 'PROJECT_ACTIVITY',
  MONEY_ADVANCE = 'MONEY_ADVANCE',
  REIMBURSEMENT = 'REIMBURSEMENT',
  OTHER = 'OTHER',
}

registerEnumType(ExpenseRequestType, { name: 'ExpenseRequestType' });
