import { registerEnumType } from '@nestjs/graphql';

export enum GradingSystem {
  WAEC = 'waec',
  PERCENTAGE = 'percentage',
  LETTER = 'letter',
  GPA = 'gpa',
}

registerEnumType(GradingSystem, { name: 'GradingSystem' });
