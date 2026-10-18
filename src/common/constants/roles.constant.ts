import { UserRole } from '../enums';

export const TEACHER_ROLES: UserRole[] = [
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
];

export const LEADERSHIP_ROLES: UserRole[] = [UserRole.SCHOOL_MANAGEMENT];

export const SCHOOL_STAFF_ROLES: UserRole[] = [
  UserRole.SCHOOL_ADMIN,
  ...LEADERSHIP_ROLES,
  ...TEACHER_ROLES,
];
