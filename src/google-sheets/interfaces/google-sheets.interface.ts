export interface TransactionResult {
  success: boolean;
  data?: [string, string, string, number, string];
  row?: number;
  error?: string;
}

export interface CategoryResult {
  success: boolean;
  data?: [number, string, string, string];
  row?: number;
  error?: string;
}
