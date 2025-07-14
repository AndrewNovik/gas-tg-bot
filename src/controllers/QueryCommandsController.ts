import { CONFIG } from '../config';
import { CategoryType } from '../types';
import { StateManager } from '../services/StateManager';
import { MessageService } from '../services/MessageService';

export class QueryCommandsController {
  private static instance: QueryCommandsController;
  private stateManager: StateManager;
  private messageService: MessageService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
  }

  public static getInstance(): QueryCommandsController {
    if (!QueryCommandsController.instance) {
      QueryCommandsController.instance = new QueryCommandsController();
    }
    return QueryCommandsController.instance;
  }

  public handleQueryCommand(query: any): void {
    const chatId = query.message.chat.id;
    const data = query.data;
    const firstName = query.from.first_name;

    // Ответ на callback - ОБЯЗАТЕЛЬНО в течение 10 секунд
    this.answerCallbackQuery(query.id);

    switch (data) {
      case 'start':
        this.messageService.sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
        break;

      case 'help':
        this.messageService.sendText(
          chatId,
          'Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню\n/add - добавить транзакцию\n/addcategory - добавить категорию',
        );
        break;

      case 'stats':
        this.messageService.sendText(chatId, '📊 Статистика пока недоступна');
        break;

      case 'settings':
        this.messageService.sendText(chatId, '⚙️ Настройки пока недоступны');
        break;

      // Обработка типов категорий
      case 'category_type_income':
        this.handleCategoryTypeSelection(chatId, CategoryType.INCOME);
        break;

      case 'category_type_expense':
        this.handleCategoryTypeSelection(chatId, CategoryType.EXPENSE);
        break;

      case 'category_type_transfer':
        this.handleCategoryTypeSelection(chatId, CategoryType.TRANSFER);
        break;

      case 'cancel_add_category':
        this.handleCancelAddCategory(chatId);
        break;

      default:
        this.messageService.sendText(chatId, 'Неизвестная команда');
    }
  }

  private handleCategoryTypeSelection(chatId: number, type: CategoryType): void {
    try {
      // Обновляем состояние с типом
      this.stateManager.updateUserStateData(chatId, { type: type });

      // Переходим к вводу эмодзи (обновляем только тип, сохраняя данные)
      this.stateManager.updateUserStateType(chatId, 'adding_category_emoji' as any);

      const typeNames = {
        [CategoryType.INCOME]: 'Доход',
        [CategoryType.EXPENSE]: 'Расход',
        [CategoryType.TRANSFER]: 'Перевод',
      };

      const message =
        `✅ Тип: ${typeNames[type]}\n\n` +
        `😊 Теперь введите эмодзи для категории (например: 🍕, 🚗, 📚):`;

      this.messageService.sendText(chatId, message);
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в handleCategoryTypeSelection для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleCancelAddCategory(chatId: number): void {
    this.stateManager.clearUserState(chatId);
    this.messageService.sendText(chatId, '❌ Добавление категории отменено');
  }

  private answerCallbackQuery(callbackQueryId: string): any {
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
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Критическая ошибка answerCallbackQuery: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }
}
