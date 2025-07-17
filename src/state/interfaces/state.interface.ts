import { CALLBACK_COMMANDS } from '@commands/enums/commands.enums';
import {
  CategoryAddStepsCallBack,
  CategoryTypeCallBack,
  KeyboardCancelCallBack,
  TransactionAddStepsCallBack,
} from '@state/enums/state.enums';
export interface UserState {
  step?: CategoryAddStepsCallBack | TransactionAddStepsCallBack | null;
  data: Record<string, any>;
}

export interface Keyboard {
  inline_keyboard: {
    text: string;
    callback_data:
      | KeyboardCancelCallBack
      | CategoryTypeCallBack
      | CategoryAddStepsCallBack
      | CALLBACK_COMMANDS;
  }[][];
}
