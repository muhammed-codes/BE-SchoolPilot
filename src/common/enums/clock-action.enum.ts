import { registerEnumType } from '@nestjs/graphql';

export enum ClockAction {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
}

registerEnumType(ClockAction, { name: 'ClockAction' });
