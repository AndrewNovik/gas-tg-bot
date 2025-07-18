import {
  addTransactionReplyKeyboard,
  confirmInlineKeyboard,
  startMenuReplyKeyboard,
} from '@commands/consts';
import { TRANSACTION_TYPE } from '@commands';
import { CommandService } from '@commands/services';
import { TransactionCategory } from '@google-sheets/interfaces';
import { GoogleSheetsService } from '@google-sheets/services';
import { MessageService } from '@messages/services/message.service';
import { AbstractClassService } from '@shared/abstract-class.service';
import { STATE_STEPS, StateManager } from '@state';
import { TelegramInlineKeyboardInterface } from '@telegram-api';

export class TextCommandsFacade implements AbstractClassService<TextCommandsFacade> {
  private static instance: TextCommandsFacade;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  public readonly googleSheetsService: GoogleSheetsService;
  public readonly commandService: CommandService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
    this.commandService = CommandService.getInstance();
  }

  public static getInstance(): TextCommandsFacade {
    if (!TextCommandsFacade.instance) {
      TextCommandsFacade.instance = new TextCommandsFacade();
    }
    return TextCommandsFacade.instance;
  }

  public mainCommandStart(chatId: number, firstName: string): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      `Привет, ${firstName}! Выбери действие:`,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandCancel(chatId: number): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      `Начнем сначала! Выбери действие:`,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandAddTransactionStart(chatId: number, firstName: string): void {
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_TYPE);
    this.messageService.sendReplyMarkup(
      chatId,
      `${firstName}! Выбери тип транзакции:`,
      addTransactionReplyKeyboard,
    );
  }

  public mainCommandAddCategoryStart(chatId: number): void {
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_NAME);
    this.messageService.sendText(chatId, `📝 Введи название категории:`);
  }

  public noSuchCommandFound(chatId: number, text: string): void {
    this.messageService.sendText(chatId, `❌ Неизвестная команда: "${text}"`);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      `Начнем сначала! Выбери действие:`,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandAddTransactionChooseCategory(chatId: number, type: TRANSACTION_TYPE): void {
    // Получаем категории по типу
    const categories: TransactionCategory[] = this.googleSheetsService.getCategoriesByType(type);

    if (categories.length === 0) {
      this.messageService.sendText(
        chatId,
        `❌ Категории для типа "${type}" не найдены. Сначала добавьте категории через /addcategory`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    this.stateManager.updateUserStateData(chatId, { transactionType: type });

    // Создаем клавиатуру с категориями
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.commandService.createCategoryInlineKeyboard(categories),
    };

    this.messageService.sendInlineKeyboard(chatId, `Выбери категорию`, keyboard);
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE);
  }

  public handleAddTransactionAmount(chatId: number, text: string): void {
    this.stateManager.updateUserStateData(chatId, { amount: text });

    const currentUserState = this.stateManager.getUserState(chatId);
    const data = currentUserState?.data;

    const { transactionType, amount, transactionCategory } = data as {
      transactionType: TRANSACTION_TYPE;
      amount: string;
      transactionCategory: TransactionCategory;
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `Проверь данные: \nТип транзакции: ${transactionType} \nСумма: ${amount} \nКатегория: ${transactionCategory.name}`,
      confirmInlineKeyboard,
    );
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_CONFIRM);
  }
}
