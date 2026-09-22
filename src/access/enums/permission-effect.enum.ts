import { registerEnumType } from '@nestjs/graphql';

export enum PermissionEffect {
  GRANT = 'grant',
  DENY = 'deny',
}

registerEnumType(PermissionEffect, { name: 'PermissionEffect' });
