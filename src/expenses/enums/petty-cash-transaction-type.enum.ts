import { registerEnumType } from '@nestjs/graphql';

export enum PettyCashTransactionType {
  REPLENISHMENT = 'REPLENISHMENT',
  DISBURSEMENT = 'DISBURSEMENT',
}

registerEnumType(PettyCashTransactionType, {
  name: 'PettyCashTransactionType',
});
