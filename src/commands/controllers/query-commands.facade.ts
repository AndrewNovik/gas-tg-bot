import { AbstractClassService } from '@shared/abstract-class.service';
import { StateManager, UserStateInterface, STATE_STEPS } from '@state';
import { MessageService } from '@messages/services/message.service';
import { GoogleSheetsService } from '@google-sheets/services';
import { TEXT_MESSAGES, TRANSACTION_TYPE } from '@commands/enums';
import { TransactionCategory } from '@google-sheets/interfaces';
import { startMenuReplyKeyboard, USERS_ID } from '@commands/consts';
import { getAdminId, getApiUrl, getToken } from '@shared';

export class QueryCommandsFacade implements AbstractClassService<QueryCommandsFacade> {
  private static instance: QueryCommandsFacade;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  private readonly googleSheetsService: GoogleSheetsService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
  }

  public static getInstance(): QueryCommandsFacade {
    if (!QueryCommandsFacade.instance) {
      QueryCommandsFacade.instance = new QueryCommandsFacade();
    }
    return QueryCommandsFacade.instance;
  }

  public answerCallbackQuery(callbackQueryId: string): any {
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
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Критическая ошибка answerCallbackQuery: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { ok: false, description: error instanceof Error ? error.message : String(error) };
    }
  }

  public handleChooseTransactionCategory(chatId: number, categoryId: string): void {
    try {
      // Получаем категорию по ID
      const category = this.googleSheetsService.getCategoryById(categoryId);

      if (!category) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.CATEGORY_NOT_FOUND);
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
        `${TEXT_MESSAGES.CATEGORY_NOT_FOUND}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public handleConfirmTransaction(
    chatId: number,
    state: UserStateInterface,
    firstName: string,
  ): void {
    try {
      const data = state.data;

      if (!data) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.TRANSACTION_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
        return;
      }

      const { transactionType, amount, transactionCategory } = data as {
        transactionType: TRANSACTION_TYPE;
        amount: string;
        transactionCategory: TransactionCategory;
      };

      // Добавляем транзакцию в Google Sheets
      const result = this.googleSheetsService.addTransaction(
        transactionType,
        amount,
        transactionCategory.name,
      );

      if (result.success) {
        USERS_ID.forEach((id) => {
          this.messageService.sendText(
            id,
            `✅ ${firstName} add ${transactionType} for ${amount} BYN in category: ${transactionCategory.name}`,
          );
        });
      } else {
        this.messageService.sendText(
          chatId,
          `${TEXT_MESSAGES.TRANSACTION_NOT_ADDED}: ${result.error}`,
        );
      }

      // Сбрасываем состояние пользователя
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Произошла ошибка: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(chatId, TEXT_MESSAGES.NEW_ACTION, startMenuReplyKeyboard);
    }
  }

  public handleCancelTransaction(chatId: number, state: UserStateInterface): void {
    this.messageService.sendText(chatId, '❌ Транзакция отменена');
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public handleEditTransaction(chatId: number, state: UserStateInterface): void {
    this.messageService.sendText(chatId, '✏️ Редактирование транзакции');
    const data = state.data;
    const { transactionType, transactionCategory } = data as {
      transactionType: TRANSACTION_TYPE;
      transactionCategory: TransactionCategory;
    };

    // Возвращаемся к шагу ввода суммы для редактирования
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_AMOUNT, {
      transactionType,
      amount: '',
      transactionCategory,
    });
    this.messageService.sendText(chatId, '📝 Введи новую сумму:');
  }

  public handleAddinngNewCategoryType(chatId: number, categoryType: TRANSACTION_TYPE): void {
    this.stateManager.updateUserStateData(chatId, { categoryType });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_EMOJI);
    this.messageService.sendText(chatId, `📝 Введи эмодзи для категории:`);
  }

  public handleConfirmCategory(chatId: number, state: UserStateInterface, firstName: string): void {
    try {
      const data = state.data;

      if (!data) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.CATEGORY_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
        return;
      }

      const { categoryName, categoryType, categoryEmoji } = data as {
        categoryName: string;
        categoryType: TRANSACTION_TYPE;
        categoryEmoji: string;
      };

      // Проверяем наличие всех необходимых данных
      if (!categoryName || !categoryType || !categoryEmoji) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.CATEGORY_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
        return;
      }

      // Добавляем категорию в Google Sheets
      const result = this.googleSheetsService.addCategory(
        categoryName,
        categoryType,
        categoryEmoji,
      );

      if (result.success) {
        USERS_ID.forEach((id) => {
          this.messageService.sendText(
            id,
            `✅ ${firstName} add new ${categoryType} category: ${categoryName} ${categoryEmoji}`,
          );
        });
      } else {
        this.messageService.sendText(
          chatId,
          `${TEXT_MESSAGES.CATEGORY_NOT_ADDED}: ${result.error}`,
        );
      }

      // Сбрасываем состояние пользователя
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(chatId, TEXT_MESSAGES.NEW_ACTION, startMenuReplyKeyboard);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `${TEXT_MESSAGES.CATEGORY_NOT_ADDED}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(
        chatId,
        TEXT_MESSAGES.RESET_USER_STATE,
        startMenuReplyKeyboard,
      );
    }
  }

  public handleCancelCategory(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.CANCEL_CATEGORY);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public handleEditCategory(chatId: number, state: UserStateInterface): void {
    this.messageService.sendText(chatId, '✏️ Редактирование категории');
    // Возвращаемся к шагу ввода названия для редактирования
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_CATEGORY_NAME);
    this.messageService.sendText(chatId, '📝 Введи новое название категории:');
  }
}
