import { CategoryTypeCallBack } from '@state';

export interface Category {
  id: number;
  name: string;
  type: CategoryTypeCallBack;
  emoji: string;
}

// Типы для команд
export interface BotCommand {
  command: string;
  description: string;
}
