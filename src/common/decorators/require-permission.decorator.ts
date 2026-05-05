import { SetMetadata } from '@nestjs/common';
import { AppResource } from '../../access/enums/resource.enum';

export type ActionType = 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: AppResource, action: ActionType) => 
  SetMetadata(PERMISSION_KEY, { resource, action });
