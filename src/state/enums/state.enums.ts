import { ADD_CATEGORY, CATEGOTY_TYPE, CANCEL } from '@state/consts/state.consts';

export enum KeyboardCancelCallBack {
  CANCEL_STEPS = `${CANCEL}_steps`,
}

export enum CategoryTypeCallBack {
  INCOME = `${CATEGOTY_TYPE}_income`,
  EXPENSE = `${CATEGOTY_TYPE}_expense`,
  TRANSFER = `${CATEGOTY_TYPE}_transfer`,
}

export enum CategoryAddStepsCallBack {
  ADD_CATEGORY_NAME = `${ADD_CATEGORY}_name`,
  ADD_CATEGORY_TYPE = `${ADD_CATEGORY}_type`,
  ADD_CATEGORY_EMOJI = `${ADD_CATEGORY}_emoji`,
}
