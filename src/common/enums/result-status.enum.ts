import { registerEnumType } from '@nestjs/graphql';

export enum ResultStatus {
  DRAFT = 'draft',
  SCORES_ENTERED = 'scores_entered',
  PENDING_ADMIN_REVIEW = 'pending_admin_review',
  PENDING_PRINCIPAL_APPROVAL = 'pending_principal_approval',
  PUBLISHED = 'published',
  RETURNED = 'returned',
}

registerEnumType(ResultStatus, { name: 'ResultStatus' });
