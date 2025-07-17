import { CONFIG } from '@config';
import {
  StateManager,
  CategoryAddStepsCallBack,
  CategoryTypeCallBack,
  KeyboardCancelCallBack,
} from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { CallbackQuery, TelegramReplyKeyboard } from '@telegram-api';
import { AbstractClassService } from '@shared';
import { USERS_ID } from '@commands/consts';
import { CategoryType, COMMANDS_CB } from '@commands/enums/commands.enums';
import { TransactionCategory } from '@google-sheets/interfaces';

export class QueryCommandsController implements AbstractClassService<QueryCommandsController> {
  private static instance: QueryCommandsController;
  private stateManager: StateManager;
  private messageService: MessageService;
  public readonly googleSheetsService: GoogleSheetsService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
  }

  public static getInstance(): QueryCommandsController {
    if (!QueryCommandsController.instance) {
      QueryCommandsController.instance = new QueryCommandsController();
    }
    return QueryCommandsController.instance;
  }

  public handleQueryCommand(query: CallbackQuery): void {
    // Проверяем, что есть сообщение
    if (!query.message) {
      return;
    }

    if (!USERS_ID.includes(query.message.chat.id)) {
      this.messageService.sendText(query.message.chat.id, 'У вас нет доступа к этому боту');
      return;
    }

    const chatId = query.message.chat.id;
    const data = query.data;
    const firstName = query.from.first_name;

    // Ответ на callback - ОБЯЗАТЕЛЬНО в течение 10 секунд
    this.answerCallbackQuery(query.id);

    this.messageService.sendText(chatId, JSON.stringify(query.data));
    const state = this.stateManager.getUserState(chatId);
    this.messageService.sendText(chatId, JSON.stringify(state));

    switch (data) {
      // Базовые команды
      case COMMANDS_CB.HELP:
        this.messageService.sendText(
          chatId,
          'Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню\n/add - добавить транзакцию\n/addcategory - добавить категорию',
        );
        break;

      case COMMANDS_CB.STATS:
        this.messageService.sendText(chatId, '📊 Статистика пока недоступна');
        break;

      case COMMANDS_CB.SETTINGS:
        this.messageService.sendText(chatId, '⚙️ Настройки пока недоступны');
        break;

      // Обработка создания типов категорий
      case CategoryTypeCallBack.INCOME:
        if (this.stateManager.isUserInSteps(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_TYPE)) {
          this.handleCategoryTypeSelection(chatId, CategoryTypeCallBack.INCOME);
        }
        break;

      case CategoryTypeCallBack.EXPENSE:
        if (this.stateManager.isUserInSteps(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_TYPE)) {
          this.handleCategoryTypeSelection(chatId, CategoryTypeCallBack.EXPENSE);
        }
        break;

      case CategoryTypeCallBack.TRANSFER:
        if (this.stateManager.isUserInSteps(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_TYPE)) {
          this.handleCategoryTypeSelection(chatId, CategoryTypeCallBack.TRANSFER);
        }
        break;

      case KeyboardCancelCallBack.CANCEL_STEPS:
        this.handleCancelAddCategory(chatId);
        break;

      // Обработка типов транзакций
      case COMMANDS_CB.INCOME:
        this.handleAddTransaction(chatId, firstName, CategoryType.INCOME);
        break;

      case COMMANDS_CB.EXPENSE:
        this.handleAddTransaction(chatId, firstName, CategoryType.EXPENSE);
        break;

      case COMMANDS_CB.TRANSFER:
        this.handleAddTransaction(chatId, firstName, CategoryType.TRANSFER);
        break;

      default:
        this.messageService.sendText(chatId, 'Неизвестная команда');
    }
  }

  private handleCategoryTypeSelection(chatId: number, type: CategoryTypeCallBack): void {
    try {
      // Обновляем состояние с типом
      this.stateManager.updateUserStateData(chatId, { type: type });

      // Переходим к вводу эмодзи (обновляем только тип, сохраняя данные)
      this.stateManager.updateUserStep(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_EMOJI);

      const typeNames = {
        [CategoryTypeCallBack.INCOME]: 'Доход',
        [CategoryTypeCallBack.EXPENSE]: 'Расход',
        [CategoryTypeCallBack.TRANSFER]: 'Перевод',
      };

      const message = `✅ Тип: ${typeNames[type]}\n\n` + `😊 Теперь введите эмодзи для категории:`;

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

  private handleAddTransaction(chatId: number, firstName: string, type: CategoryType): void {
    try {
      // Получаем категории по типу
      const categories: TransactionCategory[] = this.googleSheetsService.getCategoriesByType(type);

      if (categories.length === 0) {
        this.messageService.sendText(
          chatId,
          `❌ Категории для типа "${type}" не найдены. Сначала добавьте категории через /addcategory`,
        );
        return;
      }

      // Создаем клавиатуру с категориями
      const keyboard: TelegramReplyKeyboard = {
        keyboard: this.createCategoryKeyboard(categories),
        resize_keyboard: true,
        one_time_keyboard: false,
      };

      this.messageService.sendReplyMarkup(chatId, `Выбери категорию`, keyboard);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при получении категорий: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private createCategoryKeyboard(categories: TransactionCategory[]): string[][] {
    const keyboard: string[][] = [];
    const itemsPerRow = 2; // 2 кнопки в ряду

    for (let i = 0; i < categories.length; i += itemsPerRow) {
      const row: string[] = [];

      for (let j = 0; j < itemsPerRow && i + j < categories.length; j++) {
        const category = categories[i + j];
        row.push(`${category.emoji} ${category.name}`);
      }

      keyboard.push(row);
    }

    return keyboard;
  }
}
