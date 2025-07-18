import { TRANSACTION_TYPE } from '@commands/enums';
export interface CategoryInterface {
  id: number;
  name: string;
  type: TRANSACTION_TYPE;
  emoji: string;
}

// Типы для команд
export interface BotCommand {
  command: string;
  description: string;
}
