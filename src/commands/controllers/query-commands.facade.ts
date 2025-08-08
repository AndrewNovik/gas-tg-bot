import { AbstractClassService } from '@shared/abstract-class.service';
import { StateManager, UserStateInterface, STATE_STEPS } from '@state';
import { MessageService } from '@messages/services/message.service';
import { GoogleSheetsService } from '@google-sheets/services';
import { TEXT_MESSAGES, TRANSACTION_TYPE } from '@commands/enums';
import { TransactionCategory } from '@google-sheets/interfaces';
import {
  startMenuReplyKeyboard,
  USERS_ID,
  TRANSFER_DEBIT_CATEGORY,
  TRANSFER_CREDIT_CATEGORY,
} from '@commands/consts';
import { CommandService } from '@commands/services';
import { getAdminId, getApiUrl, getToken } from '@shared';
import { TransactionAccount } from '@google-sheets/interfaces/google-sheets.interface';
import { TelegramInlineKeyboardInterface } from '@telegram-api';

export class QueryCommandsFacade implements AbstractClassService<QueryCommandsFacade> {
  private static instance: QueryCommandsFacade;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  private readonly googleSheetsService: GoogleSheetsService;
  private readonly commandService: CommandService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
    this.commandService = CommandService.getInstance();
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
        `${TEXT_MESSAGES.CRITICAL_ERROR}: ${error instanceof Error ? error.message : String(error)}`,
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

      this.messageService.sendText(
        chatId,
        `Введите сумму ${category.type === TRANSACTION_TYPE.INCOME ? 'дохода' : 'расхода'} в ${category.name}:`,
      );
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `${TEXT_MESSAGES.CATEGORY_NOT_FOUND}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public handleChooseTransactionAccount(chatId: number, accountId: string): void {
    const account = this.googleSheetsService.getAccountById(accountId);
    if (!account) {
      this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_FOUND);
      return;
    }

    // Обновляем состояние пользователя с выбранным счетом
    this.stateManager.updateUserStateData(chatId, {
      transactionAccount: account,
    });

    // Получаем тип транзакции из состояния пользователя
    const currentState = this.stateManager.getUserState(chatId);
    const transactionType = currentState?.data?.transactionType as TRANSACTION_TYPE;

    if (!transactionType) {
      this.messageService.sendText(chatId, TEXT_MESSAGES.TRANSACTION_NOT_ADDED);
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Получаем категории по типу транзакции
    const categories = this.googleSheetsService.getCategoriesByType(transactionType);

    if (categories.length === 0) {
      this.messageService.sendText(
        chatId,
        `❌ Категории для типа "${transactionType}" не найдены. Сначала добавьте категории через /addcategory`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Создаем клавиатуру с категориями (3 элемента в ряду)
    const keyboard = {
      inline_keyboard: this.commandService.createCategoryInlineKeyboard(categories),
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `☝️ Выбери категорию для ${account.name}:`,
      keyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE);
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

      const { transactionType, amount, transactionCategory, transactionAccount } = data as {
        transactionType: TRANSACTION_TYPE;
        amount: string;
        transactionCategory: TransactionCategory;
        transactionAccount: TransactionAccount;
      };

      const transactionComment = data?.transactionComment || '';

      if (!transactionType || !amount || !transactionCategory || !transactionAccount) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.TRANSACTION_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
        return;
      }

      // Добавляем транзакцию в Google Sheets
      const result = this.googleSheetsService.addTransaction(
        transactionType,
        amount,
        transactionCategory.name,
        transactionComment,
        String(chatId),
        firstName,
        transactionAccount.name,
        String(transactionAccount.id),
      );

      if (result.success) {
        // Получаем обновленный баланс счета после транзакции
        const updatedAccount = this.googleSheetsService.getAccountById(
          String(transactionAccount.id),
        );
        const balanceInfo = updatedAccount
          ? `\n💰 Остаток на счете: ${parseFloat(updatedAccount.currentBalance).toFixed(2).replace('.', ',')} ${updatedAccount.currency}`
          : '';

        USERS_ID.forEach((id) => {
          this.messageService.sendText(
            id,
            `✅ ${firstName} добавил ${transactionType} на ${amount} BYN в категорию: ${transactionCategory.name} (Счет: ${transactionAccount.name})${balanceInfo}\n${transactionComment.length > 0 ? `Комментарий: ${transactionComment}` : ''}`,
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
        `${TEXT_MESSAGES.TRANSACTION_NOT_ADDED}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(
        chatId,
        TEXT_MESSAGES.RESET_USER_STATE,
        startMenuReplyKeyboard,
      );
    }
  }

  public handleCancelTransaction(chatId: number, state: UserStateInterface): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.CANCEL_TRANSACTION);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public handleEditTransaction(chatId: number, state: UserStateInterface): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.EDIT_TRANSACTION);
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
    this.messageService.sendText(chatId, '📝 Введите новую сумму транзакции:');
  }

  public handleAddCommentToTransaction(chatId: number): void {
    this.messageService.sendText(chatId, '📝 Введите комментарий к транзакции:');
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_COMMENT);
  }

  public handleAddinngNewCategoryType(chatId: number, categoryType: TRANSACTION_TYPE): void {
    this.stateManager.updateUserStateData(chatId, { categoryType });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_EMOJI);
    this.messageService.sendText(chatId, `📝 Введите эмодзи для категории:`);
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

      const categoryComment = data?.categoryComment || '';

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
        categoryComment,
      );

      if (result.success) {
        USERS_ID.forEach((id) => {
          this.messageService.sendText(
            id,
            `✅ ${firstName} добавил новую категорию: ${categoryName} ${categoryEmoji}\n${categoryComment.length > 0 ? `Комментарий: ${categoryComment}` : ''}`,
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

  public handleEditCategory(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.EDIT_CATEGORY);
    // Возвращаемся к шагу ввода названия для редактирования
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_CATEGORY_NAME);
    this.messageService.sendText(chatId, '📝 Введите новое название категории:');
  }

  public handleAddCommentToCategory(chatId: number): void {
    this.messageService.sendText(chatId, '📝 Введите комментарий к категории:');
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_COMMENT);
  }

  public handleConfirmAccount(chatId: number, state: UserStateInterface, firstName: string): void {
    try {
      const data = state.data;

      if (!data) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
        return;
      }

      const { accountName, accountCurrency, accountAmount } = data as {
        accountName: string;
        accountCurrency: string;
        accountAmount: string;
      };

      const accountComment = data?.accountComment || '';

      if (!accountName || !accountCurrency || !accountAmount) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
      }

      const result = this.googleSheetsService.addAccount(
        accountName,
        accountCurrency,
        accountAmount,
        accountComment,
      );

      if (result.success) {
        USERS_ID.forEach((id) => {
          this.messageService.sendText(
            id,
            `✅ ${firstName} добавил новый счет: ${accountName} ${accountCurrency} ${accountAmount}\n${accountComment.length > 0 ? `Комментарий: ${accountComment}` : ''}`,
          );
        });
      } else {
        this.messageService.sendText(chatId, `${TEXT_MESSAGES.ACCOUNT_NOT_ADDED}: ${result.error}`);
      }
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `${TEXT_MESSAGES.ACCOUNT_NOT_ADDED}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(
        chatId,
        TEXT_MESSAGES.RESET_USER_STATE,
        startMenuReplyKeyboard,
      );
    }
    this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_ADDED);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(chatId, TEXT_MESSAGES.NEW_ACTION, startMenuReplyKeyboard);
  }

  public handleCancelAccount(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_ADDED);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendText(chatId, TEXT_MESSAGES.CANCEL_ACCOUNT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public handleEditAccount(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.EDIT_ACCOUNT);
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_ACCOUNT_NAME);
    this.messageService.sendText(chatId, '📝 Введите новое название счета:');
  }

  public handleAddCommentToAccount(chatId: number): void {
    this.messageService.sendText(chatId, '📝 Введите комментарий к счету:');
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_ACCOUNT_COMMENT);
  }

  // TRANSFER METHODS
  public handleChooseTransferFromAccount(chatId: number, accountId: string): void {
    const account = this.googleSheetsService.getAccountById(accountId);
    if (!account) {
      this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_FOUND);
      return;
    }

    // Сохраняем выбранный счет списания
    this.stateManager.updateUserStateData(chatId, {
      transferFromAccount: account,
    });

    // Переходим к выбору счета пополнения
    this.commandService.handleTransferToAccountChoice(chatId, accountId);
  }

  public handleChooseTransferToAccount(chatId: number, accountId: string): void {
    const account = this.googleSheetsService.getAccountById(accountId);
    if (!account) {
      this.messageService.sendText(chatId, TEXT_MESSAGES.ACCOUNT_NOT_FOUND);
      return;
    }

    // Сохраняем выбранный счет пополнения
    this.stateManager.updateUserStateData(chatId, {
      transferToAccount: account,
    });

    // Переходим к вводу суммы
    this.messageService.sendText(chatId, TEXT_MESSAGES.ENTER_TRANSFER_AMOUNT);
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_AMOUNT);
  }

  public handleConfirmTransfer(chatId: number, state: UserStateInterface, firstName: string): void {
    try {
      const data = state.data;
      const { transferFromAccount, transferToAccount, transferAmount, transferComment } = data as {
        transferFromAccount: TransactionAccount;
        transferToAccount: TransactionAccount;
        transferAmount: string;
        transferComment?: string;
      };

      const comment = transferComment || '';

      const debitComment = comment
        ? `${comment} (перевод на ${transferToAccount.name})`
        : `Перевод на ${transferToAccount.name}`;
      const creditComment = comment
        ? `${comment} (перевод с ${transferFromAccount.name})`
        : `Перевод с ${transferFromAccount.name}`;

      // Добавляем обе транзакции
      const debitResult = this.googleSheetsService.addTransaction(
        TRANSACTION_TYPE.EXPENSE,
        transferAmount,
        TRANSFER_DEBIT_CATEGORY,
        debitComment,
        chatId.toString(),
        firstName,
        transferFromAccount.name,
        transferFromAccount.id.toString(),
      );

      const creditResult = this.googleSheetsService.addTransaction(
        TRANSACTION_TYPE.INCOME,
        transferAmount,
        TRANSFER_CREDIT_CATEGORY,
        creditComment,
        chatId.toString(),
        firstName,
        transferToAccount.name,
        transferToAccount.id.toString(),
      );

      if (debitResult.success && creditResult.success) {
        this.messageService.sendText(chatId, TEXT_MESSAGES.TRANSFER_ADDED);
        this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.NEW_ACTION,
          startMenuReplyKeyboard,
        );
      } else {
        this.messageService.sendText(
          chatId,
          `${TEXT_MESSAGES.TRANSFER_NOT_ADDED}: ${debitResult.error || creditResult.error}`,
        );
        this.stateManager.updateUserStateStep(chatId, STATE_STEPS.DEFAULT);
        this.messageService.sendReplyMarkup(
          chatId,
          TEXT_MESSAGES.RESET_USER_STATE,
          startMenuReplyKeyboard,
        );
      }
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `${TEXT_MESSAGES.TRANSFER_NOT_ADDED}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.updateUserStateStep(chatId, STATE_STEPS.DEFAULT);
      this.messageService.sendReplyMarkup(
        chatId,
        TEXT_MESSAGES.RESET_USER_STATE,
        startMenuReplyKeyboard,
      );
    }
  }

  public handleCancelTransfer(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.CANCEL_TRANSFER);
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public handleEditTransfer(chatId: number): void {
    this.messageService.sendText(chatId, TEXT_MESSAGES.EDIT_TRANSFER);
    // Получаем все счета
    const accounts = this.googleSheetsService.getAllAccounts();

    if (accounts.length < 2) {
      this.messageService.sendText(
        chatId,
        `❌ Для трансфера нужно минимум 2 счета. Добавьте еще счета через /addaccount`,
      );
      this.stateManager.updateUserStateStep(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Создаем клавиатуру со счетами для списания
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.commandService.createTransferFromAccountInlineKeyboard(accounts),
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      TEXT_MESSAGES.CHOOSE_FROM_ACCOUNT_FOR_TRANSFER,
      keyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_FROM_ACCOUNT);
  }

  public handleAddCommentToTransfer(chatId: number): void {
    this.messageService.sendText(chatId, '📝 Введите комментарий к трансферу:');
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_COMMENT);
  }
}
