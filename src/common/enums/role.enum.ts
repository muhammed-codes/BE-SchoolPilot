import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  PRINCIPAL = 'principal',
  CLASS_TEACHER = 'class_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  PARENT = 'parent',
}

registerEnumType(UserRole, { name: 'UserRole' });
