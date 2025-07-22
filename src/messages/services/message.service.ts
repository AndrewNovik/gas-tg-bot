import { startMenuReplyKeyboard } from '@commands';
import { ApiResponse } from '@messages';
import { AbstractClassService, getAdminId, getApiUrl, getToken } from '@shared';
import { CACHE_TIMEOUT } from '@state';
import { TelegramInlineKeyboardInterface, TelegramReplyKeyboardInterface } from '@telegram-api';

export class MessageService implements AbstractClassService<MessageService> {
  private static instance: MessageService;

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  public sendText(chatId: number, text: string): ApiResponse {
    const url = `${getApiUrl()}${getToken()}/sendMessage`;

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

  public answerCallbackQuery(callbackQueryId: string): ApiResponse {
    const url = `${getApiUrl()}${getToken()}/answerCallbackQuery`;

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

  public sendInlineKeyboard(
    chatId: number,
    messageText: string,
    keyboard: TelegramInlineKeyboardInterface,
  ): ApiResponse {
    const url = `${getApiUrl()}${getToken()}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: messageText,
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

  public sendReplyMarkup(
    chatId: number,
    messageText: string,
    keyboard: TelegramReplyKeyboardInterface,
  ): ApiResponse {
    const url = `${getApiUrl()}${getToken()}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
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

  public sendAdminMessage(message: string): void {
    try {
      const url = `${getApiUrl()}${getToken()}/sendMessage`;
      const payload = {
        chat_id: Number(getAdminId()),
        text: message,
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

      UrlFetchApp.fetch(url, options);
    } catch (error) {
      throw new Error(
        `❌ Ошибка в sendAdminMessage: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public restartUser(chatId: number): void {
    this.sendReplyMarkup(
      chatId,
      `❌ Вы не совершали никаких действий в течении ${CACHE_TIMEOUT} секунд, поэтому прогресс был сброшен. Начните сначала.`,
      startMenuReplyKeyboard,
    );
  }
}
