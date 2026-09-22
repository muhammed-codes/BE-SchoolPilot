import { SetMetadata } from '@nestjs/common';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';

export type LegacyActionType =
  | 'canCreate'
  | 'canRead'
  | 'canUpdate'
  | 'canDelete';
export type ActionType = LegacyActionType | PermissionAction;

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: AppResource, action: ActionType) =>
  SetMetadata(PERMISSION_KEY, { resource, action });
