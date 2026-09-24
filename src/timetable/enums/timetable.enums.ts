import { registerEnumType } from '@nestjs/graphql';

export enum RoomType {
  CLASSROOM = 'CLASSROOM',
  LAB = 'LAB',
  LIBRARY = 'LIBRARY',
  HALL = 'HALL',
  WORKSHOP = 'WORKSHOP',
  OUTDOOR = 'OUTDOOR',
  OTHER = 'OTHER',
}

export enum NonTeachingSlotType {
  BREAK = 'BREAK',
  ASSEMBLY = 'ASSEMBLY',
  EXTRACURRICULAR = 'EXTRACURRICULAR',
  OTHER = 'OTHER',
}

export enum PeriodSlotType {
  TEACHING = 'TEACHING',
  BREAK = 'BREAK',
  ASSEMBLY = 'ASSEMBLY',
  REGISTRATION = 'REGISTRATION',
  PRAYER = 'PRAYER',
  LUNCH = 'LUNCH',
  ACTIVITY = 'ACTIVITY',
  EXTRACURRICULAR = 'EXTRACURRICULAR',
  STUDY = 'STUDY',
  TRANSITION = 'TRANSITION',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum AvailabilitySource {
  SELF_SUBMITTED = 'SELF_SUBMITTED',
  ADMIN_SET = 'ADMIN_SET',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TimetableExportView {
  SCHOOL = 'SCHOOL',
  CLASS = 'CLASS',
  TEACHER = 'TEACHER',
  ROOM = 'ROOM',
}

export enum ConflictSeverity {
  BLOCKING = 'BLOCKING',
  WARNING = 'WARNING',
}

export enum ConflictType {
  TEACHER_DOUBLE_BOOKED = 'TEACHER_DOUBLE_BOOKED',
  ROOM_DOUBLE_BOOKED = 'ROOM_DOUBLE_BOOKED',
  ROOM_CAPACITY_EXCEEDED = 'ROOM_CAPACITY_EXCEEDED',
  CLASS_DUPLICATE_SLOT = 'CLASS_DUPLICATE_SLOT',
  TEACHER_OVERLOAD = 'TEACHER_OVERLOAD',
  TEACHER_UNAVAILABLE = 'TEACHER_UNAVAILABLE',
  EMPTY_PERIOD = 'EMPTY_PERIOD',
  MISSING_ASSIGNMENT = 'MISSING_ASSIGNMENT',
}

registerEnumType(RoomType, { name: 'RoomType' });
registerEnumType(NonTeachingSlotType, { name: 'NonTeachingSlotType' });
registerEnumType(PeriodSlotType, { name: 'PeriodSlotType' });
registerEnumType(AvailabilityStatus, { name: 'AvailabilityStatus' });
registerEnumType(AvailabilitySource, { name: 'AvailabilitySource' });
registerEnumType(ApprovalStatus, { name: 'ApprovalStatus' });
registerEnumType(TimetableExportView, { name: 'TimetableExportView' });
registerEnumType(ConflictSeverity, { name: 'ConflictSeverity' });
registerEnumType(ConflictType, { name: 'ConflictType' });
