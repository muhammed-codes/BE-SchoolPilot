import { registerEnumType } from '@nestjs/graphql';

export enum AppResource {
  STUDENTS = 'students',
  RESULTS = 'results',
  ATTENDANCE = 'attendance',
  CLASSES = 'classes',
  SUBJECTS = 'subjects',
  USERS = 'users',
  SETTINGS = 'settings',
  ID_CARDS = 'id_cards'
}

registerEnumType(AppResource, { name: 'AppResource' });
