// Типы для состояний пользователей
export enum StateType {
  ADDING_CATEGORY_NAME = 'adding_category_name',
  ADDING_CATEGORY_TYPE = 'adding_category_type',
  ADDING_CATEGORY_EMOJI = 'adding_category_emoji',
}

export interface UserState {
  type: StateType;
  data: Record<string, any>;
  timestamp: number;
}
