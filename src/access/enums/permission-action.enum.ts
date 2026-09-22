import { registerEnumType } from '@nestjs/graphql';

export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  PUBLISH = 'publish',
  SUBMIT = 'submit',
  IMPORT = 'import',
  PROMOTE = 'promote',
  ARCHIVE = 'archive',
  ASSIGN = 'assign',
  GENERATE = 'generate',
  CONFIGURE = 'configure',
  MANAGE = 'manage',
}

registerEnumType(PermissionAction, { name: 'PermissionAction' });
