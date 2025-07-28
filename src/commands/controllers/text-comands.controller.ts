import { StateManager, STATE_STEPS } from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { Message } from '@telegram-api';
import { AbstractClassService } from '@shared';
import { USERS_ID, MAIN_COMMANDS, TEXT_COMMANDS, TRANSACTION_TYPE } from '@commands';
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

      case MAIN_COMMANDS.ADDTRANSACTION:
      case TEXT_COMMANDS.ADDTRANSACTION:
        this.textCommandsFacade.mainCommandAddTransactionStart(chatId, firstName);
        break;

      case MAIN_COMMANDS.ADDCATEGORY:
      case TEXT_COMMANDS.ADDCATEGORY:
        this.textCommandsFacade.mainCommandAddCategoryStart(chatId);
        break;

      case MAIN_COMMANDS.ADDACCOUNT:
      case TEXT_COMMANDS.ADDACCOUNT:
        this.textCommandsFacade.mainCommandAddAccountStart(chatId);
        break;

      case MAIN_COMMANDS.ADDINCOME:
      case TEXT_COMMANDS.INCOME:
        this.textCommandsFacade.mainCommandAddTransactionChooseAccount(
          chatId,
          TRANSACTION_TYPE.INCOME,
        );
        break;

      case MAIN_COMMANDS.ADDEXPENSE:
      case TEXT_COMMANDS.EXPENSE:
        this.textCommandsFacade.mainCommandAddTransactionChooseAccount(
          chatId,
          TRANSACTION_TYPE.EXPENSE,
        );
        break;

      case MAIN_COMMANDS.ADDTRANSFER:
      case TEXT_COMMANDS.TRANSFER:
        this.textCommandsFacade.mainCommandAddTransferStart(chatId);
        break;

      case MAIN_COMMANDS.CANCEL:
      case TEXT_COMMANDS.CANCEL:
        this.textCommandsFacade.mainCommandCancel(chatId);
        break;

      default:
        // Для других сообщений, которые приходят и должны быть обработаны в зависимости от текущего стейт степа
        const currentUserState = this.stateManager.getUserState(chatId);

        switch (currentUserState?.step) {
          case STATE_STEPS.DEFAULT:
          case STATE_STEPS.ADD_TRANSACTION_TYPE:
            switch (text) {
              case TEXT_COMMANDS.INCOME:
                this.textCommandsFacade.mainCommandAddTransactionChooseAccount(
                  chatId,
                  TRANSACTION_TYPE.INCOME,
                );
                break;
              case TEXT_COMMANDS.EXPENSE:
                this.textCommandsFacade.mainCommandAddTransactionChooseAccount(
                  chatId,
                  TRANSACTION_TYPE.EXPENSE,
                );
                break;
              case TEXT_COMMANDS.TRANSFER:
                this.textCommandsFacade.mainCommandAddTransactionChooseAccount(
                  chatId,
                  TRANSACTION_TYPE.TRANSFER,
                );
                break;
              case TEXT_COMMANDS.ADDCATEGORY:
                this.textCommandsFacade.mainCommandAddCategoryStart(chatId);
                break;
              case TEXT_COMMANDS.ADDTRANSACTION:
                this.textCommandsFacade.mainCommandAddTransactionStart(chatId, firstName);
                break;
              case TEXT_COMMANDS.CANCEL:
                this.textCommandsFacade.mainCommandCancel(chatId);
                break;

              default:
                this.textCommandsFacade.noSuchCommandFound(chatId, text);
                break;
            }
            break;

          case STATE_STEPS.ADD_TRANSACTION_AMOUNT:
            this.textCommandsFacade.handleAddTransactionAmount(chatId, text);
            break;

          case STATE_STEPS.ADD_TRANSACTION_COMMENT:
            this.textCommandsFacade.handleAddTransactionComment(chatId, text);
            break;

          case STATE_STEPS.ADD_CATEGORY_NAME:
            this.textCommandsFacade.handleAddCategoryName(chatId, text);
            break;

          case STATE_STEPS.ADD_CATEGORY_EMOJI:
            this.textCommandsFacade.handleAddCategoryEmoji(chatId, text);
            break;

          case STATE_STEPS.ADD_CATEGORY_COMMENT:
            this.textCommandsFacade.handleAddCategoryComment(chatId, text);
            break;

          case STATE_STEPS.ADD_ACCOUNT_NAME:
            this.textCommandsFacade.handleAddAccountName(chatId, text);
            break;

          case STATE_STEPS.ADD_ACCOUNT_CURRENCY:
            this.textCommandsFacade.handleAddAccountCurrency(chatId, text);
            break;

          case STATE_STEPS.ADD_ACCOUNT_AMOUNT:
            this.textCommandsFacade.handleAddAccountAmount(chatId, text);
            break;

          case STATE_STEPS.ADD_ACCOUNT_COMMENT:
            this.textCommandsFacade.handleAddAccountComment(chatId, text);
            break;

          case STATE_STEPS.ADD_TRANSFER_AMOUNT:
            this.textCommandsFacade.handleAddTransferAmount(chatId, text);
            break;

          case STATE_STEPS.ADD_TRANSFER_COMMENT:
            this.textCommandsFacade.handleAddTransferComment(chatId, text);
            break;

          default:
            this.textCommandsFacade.noSuchCommandFound(chatId, text);
            break;
        }
    }
  }
}
