import { registerEnumType } from '@nestjs/graphql';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  WITHDRAWN = 'WITHDRAWN',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(StudentStatus, {
  name: 'StudentStatus',
  description: 'The operational status of a student in the school',
});
