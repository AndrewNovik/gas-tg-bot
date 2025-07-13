import { CONFIG } from '../config';

export class WebhookService {
  private static instance: WebhookService;

  private constructor() { }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  public setWebhook(): void {
    const webUrl = `https://script.google.com/macros/s/${CONFIG.WEB_APP_ID}/exec`;
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setWebhook`;

    const payload = {
      url: webUrl,
      allowed_updates: ["message", "callback_query"]
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        console.log("✅ Webhook успешно установлен с поддержкой callback_query");
      } else {
        console.log(`❌ Ошибка установки webhook: ${result.description}`);
      }
    } catch (error) {
      console.error('❌ Критическая ошибка при установке webhook:', error instanceof Error ? error.message : String(error));
    }
  }

  public getWebhookInfo(): void {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getWebhookInfo`;

    try {
      const response = UrlFetchApp.fetch(url);
      const result = JSON.parse(response.getContentText());
      console.log("Информация о вебхуке:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Критическая ошибка при получении информации о webhook:', error instanceof Error ? error.message : String(error));
    }
  }

  public deleteWebhook(): void {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteWebhook`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        drop_pending_updates: true,
      }),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        console.log("✅ Webhook успешно удален");
      } else {
        console.log(`❌ Ошибка удаления webhook: ${result.description}`);
      }
    } catch (error) {
      console.error('❌ Критическая ошибка при удалении webhook:', error instanceof Error ? error.message : String(error));
    }
  }
} 