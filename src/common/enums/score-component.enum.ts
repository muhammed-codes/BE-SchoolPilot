import { registerEnumType } from '@nestjs/graphql';

export enum ScoreComponent {
  CA = 'ca',
  MID_TERM = 'mid_term',
  ASSIGNMENT = 'assignment',
  EXAM = 'exam',
}

registerEnumType(ScoreComponent, { name: 'ScoreComponent' });
