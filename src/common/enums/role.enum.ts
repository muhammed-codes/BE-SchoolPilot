export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  SCHOOL_MANAGEMENT = 'school_management',
  // Retained only so the migration can read and consolidate legacy records.
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  HEAD_TEACHER = 'head_teacher',
  CLASS_TEACHER = 'class_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  BURSAR = 'bursar',
  PARENT = 'parent',
}
