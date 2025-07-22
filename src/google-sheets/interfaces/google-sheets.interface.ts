export interface TransactionResult {
  success: boolean;
  data?: [number, string, string, string, string, string];
  row?: number;
  error?: string;
}

export interface CategoryResult {
  success: boolean;
  data?: [number, string, string, string];
  row?: number;
  error?: string;
}

export interface AccountResult {
  success: boolean;
  data?: [number, string, string, string];
  row?: number;
  error?: string;
}

export interface TransactionCategory {
  id: number;
  name: string;
  type: string;
  emoji: string;
}
