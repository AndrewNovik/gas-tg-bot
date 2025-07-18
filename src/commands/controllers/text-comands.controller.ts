import { CONFIG } from '@config';
import {
  StateManager,
  STATE_STEPS,
  CREATE_CATEGORY_TYPE_CALLBACK,
  KEYBOARD_CANCEL_CALLBACK,
  UserStateInterface,
} from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import {
  Message,
  TelegramInlineKeyboardInterface,
  TelegramReplyKeyboardInterface,
} from '@telegram-api';
import { AbstractClassService } from '@shared';
import {
  addTransactionReplyKeyboard,
  startMenuReplyKeyboard,
  USERS_ID,
  MAIN_COMMANDS,
  TEXT_COMMANDS,
  TRANSACTION_TYPE,
} from '@commands';
import { TransactionCategory } from '@google-sheets/interfaces';
import { TextCommandsFacade } from './text-commands.facade';

export class TextCommandsController implements AbstractClassService<TextCommandsController> {
  private static instance: TextCommandsController;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  public readonly googleSheetsService: GoogleSheetsService;
  public readonly textCommandsFacade: TextCommandsFacade;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
    this.textCommandsFacade = TextCommandsFacade.getInstance();
  }

  public static getInstance(): TextCommandsController {
    if (!TextCommandsController.instance) {
      TextCommandsController.instance = new TextCommandsController();
    }
    return TextCommandsController.instance;
  }

  public handleTextCommand(message: Message): void {
    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from?.first_name || 'Пользователь';

    if (!USERS_ID.includes(chatId)) {
      this.messageService.sendText(chatId, 'У вас нет доступа к этому боту');
      return;
    }

    // Если нет текста, выходим
    if (!text) {
      return;
    }

    switch (text) {
      case MAIN_COMMANDS.START:
        this.textCommandsFacade.mainCommandStart(chatId, firstName);
        break;

      case MAIN_COMMANDS.ADDTRANSACTION || TEXT_COMMANDS.ADDTRANSACTION:
        this.textCommandsFacade.mainCommandAddTransactionStart(chatId, firstName);
        break;

      case MAIN_COMMANDS.ADDCATEGORY || TEXT_COMMANDS.ADDCATEGORY:
        this.textCommandsFacade.mainCommandAddCategoryStart(chatId);
        break;

      case MAIN_COMMANDS.ADDINCOME:
        this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
          chatId,
          TRANSACTION_TYPE.INCOME,
        );
        break;

      case MAIN_COMMANDS.ADDEXPENSE:
        this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
          chatId,
          TRANSACTION_TYPE.EXPENSE,
        );
        break;

      case MAIN_COMMANDS.ADDTRANSFER:
        this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
          chatId,
          TRANSACTION_TYPE.TRANSFER,
        );
        break;

      case MAIN_COMMANDS.CANCEL || TEXT_COMMANDS.CANCEL:
        this.textCommandsFacade.mainCommandCancel(chatId);
        break;

      default:
        // Для других сообщений, которые приходят и должны быть обработаны в зависимости от текущего стейт степа
        const currentUserState = this.stateManager.getUserState(chatId);

        switch (currentUserState?.step) {
          case STATE_STEPS.DEFAULT || STATE_STEPS.ADD_TRANSACTION_TYPE:
            switch (text) {
              case TEXT_COMMANDS.INCOME:
                this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
                  chatId,
                  TRANSACTION_TYPE.INCOME,
                );
                break;
              case TEXT_COMMANDS.EXPENSE:
                this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
                  chatId,
                  TRANSACTION_TYPE.EXPENSE,
                );
                break;
              case TEXT_COMMANDS.TRANSFER:
                this.textCommandsFacade.mainCommandAddTransactionChooseCategory(
                  chatId,
                  TRANSACTION_TYPE.TRANSFER,
                );
                break;

              default:
                this.textCommandsFacade.noSuchCommandFound(chatId, text);
                break;
            }
            break;

          case STATE_STEPS.ADD_TRANSACTION_AMOUNT:
            this.textCommandsFacade.handleAddTransactionAmount(chatId, text);
            break;

          default:
            this.textCommandsFacade.noSuchCommandFound(chatId, text);
            break;
        }
    }
  }

  private handleCategoryEmojiInput(chatId: number, emoji: string): void {
    try {
      const state: UserStateInterface | null = this.stateManager.getUserState(chatId);
      if (!state) {
        this.messageService.sendText(
          chatId,
          '❌ Состояние пользователя не найдено. Начните заново с /addcategory',
        );
        return;
      }
      this.messageService.sendText(chatId, JSON.stringify(state));
      const { name, type } = state.data;

      const typeNames: Record<string, string> = {
        [CREATE_CATEGORY_TYPE_CALLBACK.INCOME]: TRANSACTION_TYPE.INCOME,
        [CREATE_CATEGORY_TYPE_CALLBACK.EXPENSE]: TRANSACTION_TYPE.EXPENSE,
        [CREATE_CATEGORY_TYPE_CALLBACK.TRANSFER]: TRANSACTION_TYPE.TRANSFER,
      };

      // Добавляем категорию в Google Sheets
      const result = this.googleSheetsService.addCategory(name, typeNames[type], emoji);

      if (result.success) {
        const message =
          `✅ Категория успешно добавлена!\n\n` +
          `📝 Название: ${name}\n` +
          `📂 Тип: ${typeNames[type]}\n` +
          `😊 Эмодзи: ${emoji}\n`;

        this.messageService.sendText(chatId, message);
      } else {
        this.messageService.sendText(
          chatId,
          `❌ Ошибка при добавлении категории: ${result.error || 'Неизвестная ошибка'}`,
        );
      }

      // Очищаем состояние пользователя
      this.stateManager.clearUserState(chatId);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка в handleCategoryEmojiInput: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.clearUserState(chatId);
    }
  }
}
