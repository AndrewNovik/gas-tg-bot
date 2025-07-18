import { STATE_STEPS } from '@state/enums/state.enums';

export interface UserStateInterface {
  step: STATE_STEPS;
  data: Record<string, any>;
}
