import { registerEnumType } from '@nestjs/graphql';

export enum RecurringFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  TERMLY = 'TERMLY',
  ANNUAL = 'ANNUAL',
}

registerEnumType(RecurringFrequency, { name: 'RecurringFrequency' });
