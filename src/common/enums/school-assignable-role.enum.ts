import { registerEnumType } from '@nestjs/graphql';

/** Roles accepted by school-facing account creation and role update inputs. */
export enum SchoolAssignableRole {
  SCHOOL_ADMIN = 'school_admin',
  SCHOOL_MANAGEMENT = 'school_management',
  CLASS_TEACHER = 'class_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  PARENT = 'parent',
}

// Keep the established GraphQL enum name for clients while exposing only
// school-assignable role options.
registerEnumType(SchoolAssignableRole, { name: 'UserRole' });
