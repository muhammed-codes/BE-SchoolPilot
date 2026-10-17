import { registerEnumType } from '@nestjs/graphql';

export enum GradingSystem {
  WAEC = 'waec',
  NIGERIAN_BASIC = 'nigerian_basic',
  PERCENTAGE = 'percentage',
  LETTER = 'letter',
  GPA = 'gpa',
}

registerEnumType(GradingSystem, { name: 'GradingSystem' });
