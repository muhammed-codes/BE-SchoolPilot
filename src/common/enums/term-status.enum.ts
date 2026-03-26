import { registerEnumType } from '@nestjs/graphql';

export enum TermStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

registerEnumType(TermStatus, { name: 'TermStatus' });
