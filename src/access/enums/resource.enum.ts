import { registerEnumType } from '@nestjs/graphql';

export enum AppResource {
  STUDENTS = 'students',
  RESULTS = 'results',
  ATTENDANCE = 'attendance',
  CLASSES = 'classes',
  SUBJECTS = 'subjects',
  USERS = 'users',
  SETTINGS = 'settings',
  ID_CARDS = 'id_cards',
  TIMETABLE = 'timetable',
  FEES = 'fees',
}

registerEnumType(AppResource, { name: 'AppResource' });
