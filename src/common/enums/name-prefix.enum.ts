import { registerEnumType } from '@nestjs/graphql';

export enum NamePrefix {
  MR = 'mr',
  MRS = 'mrs',
  MISS = 'miss',
}

registerEnumType(NamePrefix, { name: 'NamePrefix' });
