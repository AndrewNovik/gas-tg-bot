// Типы для ответов API
export interface ApiResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}
