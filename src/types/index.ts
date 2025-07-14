// Основные типы для Telegram Bot API
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  reply_markup?: any;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message: TelegramMessage;
  chat_instance: string;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// Типы для состояний пользователей
export enum StateType {
  ADDING_CATEGORY_NAME = 'adding_category_name',
  ADDING_CATEGORY_TYPE = 'adding_category_type',
  ADDING_CATEGORY_EMOJI = 'adding_category_emoji',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface UserState {
  type: StateType;
  data: Record<string, any>;
  timestamp: number;
}

// Типы для конфигурации
export interface Config {
  TOKEN: string;
  BOT_ID: string;
  WEB_APP_ID: string;
  API_URL: string;
  WEB_APP_URL: string;
  ADMIN_ID: string;
  SPREADSHEET_ID: string;
}

// Типы для ответов API
export interface ApiResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

// Типы для транзакций
export interface Transaction {
  date: string;
  time: string;
  description: string;
  amount: number;
  category: string;
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
