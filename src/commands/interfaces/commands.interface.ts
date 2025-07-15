export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  emoji: string;
}

// Типы для команд
export interface BotCommand {
  command: string;
  description: string;
}
