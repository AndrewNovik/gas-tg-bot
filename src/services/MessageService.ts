import { CONFIG } from '../config';
import { ApiResponse } from '../types';

export class MessageService {
  private static instance: MessageService;

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  public sendText(chatId: number, text: string): ApiResponse {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;

    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      return JSON.parse(response.getContentText());
    } catch (error) {
      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }

  public sendMenu(chatId: number): ApiResponse {
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'ℹ️ Справка', callback_data: 'help' },
          { text: '👋 Приветствие', callback_data: 'start' },
        ],
        [
          { text: '📊 Статистика', callback_data: 'stats' },
          { text: '⚙️ Настройки', callback_data: 'settings' },
        ],
      ],
    };

    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: '🎛️ Основное меню\n\nВыберите действие:',
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(keyboard),
    };
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };
    try {
      const response = UrlFetchApp.fetch(url, options);
      return JSON.parse(response.getContentText());
    } catch (error) {
      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }

  public sendCategoryTypeKeyboard(chatId: number): ApiResponse {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💰 Доход', callback_data: 'category_type_income' },
          { text: '💸 Расход', callback_data: 'category_type_expense' },
        ],
        [{ text: '🔄 Перевод', callback_data: 'category_type_transfer' }],
        [{ text: '❌ Отмена', callback_data: 'cancel_add_category' }],
      ],
    };
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: '📂 Выберите тип категории:',
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(keyboard),
    };
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };
    try {
      const response = UrlFetchApp.fetch(url, options);
      return JSON.parse(response.getContentText());
    } catch (error) {
      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }

  public answerCallbackQuery(callbackQueryId: string): ApiResponse {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/answerCallbackQuery`;

    const payload = {
      callback_query_id: callbackQueryId,
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      return result;
    } catch (error) {
      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }
}
