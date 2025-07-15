// Типы для состояний пользователей
export enum StepsType {
  ADDING_CATEGORY_START = 'adding_category_start',
  ADDED_CATEGORY_NAME = 'added_category_name',
  ADDED_CATEGORY_TYPE = 'added_category_type',
  ADDED_CATEGORY_EMOJI = 'added_category_emoji',
}

export interface UserState {
  step: StepsType;
  data: Record<string, any>;
  timestamp: number;
}
