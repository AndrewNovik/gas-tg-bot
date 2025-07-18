import { CONFIG } from '@config';
import { StateManager, STATE_STEPS } from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { CallbackQuery, TelegramReplyKeyboardInterface } from '@telegram-api';
import { AbstractClassService } from '@shared';
import {
  USERS_ID,
  CALLBACK_COMMANDS,
  TRANSACTION_TYPE,
  CONFIRM_DESICION,
  CALLBACK_PREFIX,
  CONFIRM_ACTION,
} from '@commands';
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

    const state = this.stateManager.getUserState(chatId);

    // Проверяем, начинается ли callback с ключа выбора категории транзакции
    if (
      data &&
      data.startsWith(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY) &&
      state?.step === STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE
    ) {
      const categoryId = data.replace(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY, '');
      this.handleChooseTransactionCategory(chatId, categoryId);
      return;
    }

    // if (data && data.startsWith(`${CONFIRM_DESICION}${CALLBACK_PREFIX}`) && state?.step === STATE_STEPS.ADD_TRANSACTION_AMOUNT) {
    //   const action: CONFIRM_ACTION = data.replace(`${CONFIRM_DESICION}${CALLBACK_PREFIX}`, '') as unknown as CONFIRM_ACTION;
    //   switch (action) {
    //     case CONFIRM_ACTION.CONFIRM:
    //       this.handleConfirmTransaction(chatId, state);
    //       return;
    //     case CONFIRM_ACTION.CANCEL:
    //       this.
    //       return;
    //     case CONFIRM_ACTION.EDIT:
    //       this.handleEditTransaction(chatId, state);
    //       return;
    //     default:
    //       this.messageService.sendText(chatId, 'Неизвестный callback');
    //       return;
    //   }
    // }

    switch (data) {
      // Обработка создания типов категорий

      default:
        this.messageService.sendText(chatId, 'Неизвестный callback');
    }
  }

  private handleCategoryTypeSelection(chatId: number, type: TRANSACTION_TYPE): void {
    try {
      // Обновляем состояние с типом
      this.stateManager.updateUserStateData(chatId, { type: type });

      // Переходим к вводу эмодзи (обновляем только тип, сохраняя данные)
      this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_EMOJI);

      const typeNames = {
        [TRANSACTION_TYPE.INCOME]: 'Доход',
        [TRANSACTION_TYPE.EXPENSE]: 'Расход',
        [TRANSACTION_TYPE.TRANSFER]: 'Перевод',
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

  private handleChooseTransactionCategory(chatId: number, categoryId: string): void {
    try {
      // Получаем категорию по ID
      const category = this.googleSheetsService.getCategoryById(categoryId);

      if (!category) {
        this.messageService.sendText(chatId, '❌ Категория не найдена');
        return;
      }

      // Обновляем состояние пользователя с выбранной категорией
      this.stateManager.updateUserStateData(chatId, {
        transactionCategory: category,
      });

      // Переходим к следующему шагу (например, ввод суммы)
      this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_AMOUNT);

      this.messageService.sendText(chatId, `Введи сумму:`);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при выборе категории: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleAddTransaction(chatId: number, type: TRANSACTION_TYPE): void {
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
      const keyboard: TelegramReplyKeyboardInterface = {
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
