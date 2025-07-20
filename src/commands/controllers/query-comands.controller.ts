import { CONFIG } from '@config';
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

    // Ответ на callback - ОБЯЗАТЕЛЬНО в течение 10 секунд
    this.queryCommandsFacade.answerCallbackQuery(query.id);

    const state = this.stateManager.getUserState(chatId);

    // Проверяем, начинается ли callback с ключа выбора категории транзакции
    if (
      data &&
      data.startsWith(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY) &&
      state?.step === STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE
    ) {
      const categoryId = data.replace(CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY, '');
      this.queryCommandsFacade.handleChooseTransactionCategory(chatId, categoryId);
      return;
    }

    if (
      state?.step === STATE_STEPS.ADD_TRANSACTION_CONFIRM &&
      data &&
      data.startsWith(`${CONFIRM_DESICION}${CALLBACK_PREFIX}`)
    ) {
      const action: CONFIRM_ACTION = data.replace(
        `${CONFIRM_DESICION}${CALLBACK_PREFIX}`,
        '',
      ) as unknown as CONFIRM_ACTION;
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
        default:
          this.messageService.sendText(chatId, 'Неизвестный callback');
          return;
      }
    }

    if (
      state?.step === STATE_STEPS.ADD_CATEGORY_CONFIRM &&
      data &&
      data.startsWith(`${CONFIRM_DESICION}${CALLBACK_PREFIX}`)
    ) {
      const action: CONFIRM_ACTION = data.replace(
        `${CONFIRM_DESICION}${CALLBACK_PREFIX}`,
        '',
      ) as unknown as CONFIRM_ACTION;
      switch (action) {
        case CONFIRM_ACTION.CONFIRM:
          this.queryCommandsFacade.handleConfirmCategory(chatId, state, firstName);
          return;
        case CONFIRM_ACTION.CANCEL:
          this.queryCommandsFacade.handleCancelCategory(chatId);
          return;
        case CONFIRM_ACTION.EDIT:
          this.queryCommandsFacade.handleEditCategory(chatId, state);
          return;
        default:
          this.messageService.sendText(chatId, 'Неизвестный callback');
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
        this.messageService.sendText(chatId, 'Неизвестный callback');
    }
  }
}
