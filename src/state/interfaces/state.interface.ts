import {
  CategoryAddStepsCallBack,
  CategoryTypeCallBack,
  KeyboardCancelCallBack,
} from '@state/enums/state.enums';
export interface UserState {
  step: CategoryAddStepsCallBack;
  data: Record<string, any>;
  timestamp: number;
}

export interface Keyboard {
  inline_keyboard: {
    text: string;
    callback_data: KeyboardCancelCallBack | CategoryTypeCallBack | CategoryAddStepsCallBack;
  }[][];
}
