import { registerEnumType } from '@nestjs/graphql';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

registerEnumType(AttendanceStatus, { name: 'AttendanceStatus' });
