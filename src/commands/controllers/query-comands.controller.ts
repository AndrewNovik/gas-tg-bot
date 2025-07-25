import { StateManager, STATE_STEPS } from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { CallbackQuery } from '@telegram-api';
import { AbstractClassService } from '@shared';
import {
  USERS_ID,
  CALLBACK_COMMANDS,
  TRANSACTION_TYPE,
  CONFIRM_DESICION,
  CALLBACK_PREFIX,
  CONFIRM_ACTION,
  TEXT_MESSAGES,
} from '@commands';
import { QueryCommandsFacade } from './query-commands.facade';

export class QueryCommandsController implements AbstractClassService<QueryCommandsController> {
  private static instance: QueryCommandsController;
  private stateManager: StateManager;
  private messageService: MessageService;
  public readonly googleSheetsService: GoogleSheetsService;
  public readonly queryCommandsFacade: QueryCommandsFacade;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
    this.queryCommandsFacade = QueryCommandsFacade.getInstance();
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

    if (!data) {
      this.messageService.sendText(chatId, TEXT_MESSAGES.UNKNOWN_CALLBACK);
      return;
    }

    // Ответ на callback - ОБЯЗАТЕЛЬНО в течение 10 секунд
    this.queryCommandsFacade.answerCallbackQuery(query.id);

    const state = this.stateManager.getUserState(chatId);

    // Проверяем, начинается ли callback с ключа выбора категории транзакции
    if (
      data.startsWith(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY) &&
      state?.step === STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE
    ) {
      const categoryId = data.replace(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY, '');
      this.queryCommandsFacade.handleChooseTransactionCategory(chatId, categoryId);
      return;
    }

    // Проверяем, начинается ли callback с ключа выбора счета транзакции
    if (
      data.startsWith(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_ACCOUNT) &&
      state?.step === STATE_STEPS.ADD_TRANSACTION_ACCOUNT_TYPE
    ) {
      const accountId = data.replace(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_ACCOUNT, '');
      this.queryCommandsFacade.handleChooseTransactionAccount(chatId, accountId);
      return;
    }

    // Обработка колбеков для подтверждения или отмены действий
    if (data.startsWith(CONFIRM_DESICION + CALLBACK_PREFIX)) {
      const action: CONFIRM_ACTION = data.replace(
        CONFIRM_DESICION + CALLBACK_PREFIX,
        '',
      ) as unknown as CONFIRM_ACTION;
      // Определяем степ, в котором находится пользователь
      switch (state?.step) {
        case STATE_STEPS.ADD_TRANSACTION_CONFIRM:
          // Определяем действие, которое выполнил пользователь в степе транзакции
          switch (action) {
            case CONFIRM_ACTION.CONFIRM:
              this.queryCommandsFacade.handleConfirmTransaction(chatId, state, firstName);
              return;
            case CONFIRM_ACTION.CANCEL:
              this.queryCommandsFacade.handleCancelTransaction(chatId, state);
              return;
            case CONFIRM_ACTION.EDIT:
              this.queryCommandsFacade.handleEditTransaction(chatId, state);
              return;
            case CONFIRM_ACTION.ADD_COMMENT:
              this.queryCommandsFacade.handleAddCommentToTransaction(chatId);
              return;
          }
        case STATE_STEPS.ADD_CATEGORY_CONFIRM:
          // Определяем действие, которое выполнил пользователь в степе категории
          switch (action) {
            case CONFIRM_ACTION.CONFIRM:
              this.queryCommandsFacade.handleConfirmCategory(chatId, state, firstName);
              return;
            case CONFIRM_ACTION.CANCEL:
              this.queryCommandsFacade.handleCancelCategory(chatId);
              return;
            case CONFIRM_ACTION.EDIT:
              this.queryCommandsFacade.handleEditCategory(chatId);
              return;
            case CONFIRM_ACTION.ADD_COMMENT:
              this.queryCommandsFacade.handleAddCommentToCategory(chatId);
              return;
          }
        case STATE_STEPS.ADD_ACCOUNT_CONFIRM:
          switch (action) {
            case CONFIRM_ACTION.CONFIRM:
              this.queryCommandsFacade.handleConfirmAccount(chatId, state, firstName);
              return;
            case CONFIRM_ACTION.CANCEL:
              this.queryCommandsFacade.handleCancelAccount(chatId);
              return;
            case CONFIRM_ACTION.EDIT:
              this.queryCommandsFacade.handleEditAccount(chatId);
              return;
            case CONFIRM_ACTION.ADD_COMMENT:
              this.queryCommandsFacade.handleAddCommentToAccount(chatId);
              return;
          }
      }
    }

    switch (data) {
      // Обработка создания типов категорий
      case CALLBACK_COMMANDS.INCOME:
        this.queryCommandsFacade.handleAddinngNewCategoryType(chatId, TRANSACTION_TYPE.INCOME);
        return;
      case CALLBACK_COMMANDS.EXPENSE:
        this.queryCommandsFacade.handleAddinngNewCategoryType(chatId, TRANSACTION_TYPE.EXPENSE);
        return;
      case CALLBACK_COMMANDS.TRANSFER:
        this.queryCommandsFacade.handleAddinngNewCategoryType(chatId, TRANSACTION_TYPE.TRANSFER);
        return;

      default:
        this.messageService.sendText(chatId, TEXT_MESSAGES.UNKNOWN_CALLBACK);
    }
  }
}
