// Типы для ответов API
export interface ApiResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

export enum KeyboardCallBackType {
  CANCEL_STEPS = 'cancel_steps',
}
