import { BotCommand, CALLBACK_COMMANDS, setupBotCommands, TEXT_MESSAGES } from '@commands';
import { MessageService } from '@messages';
import { AbstractClassService, getAdminId, getApiUrl, getToken } from '@shared';
import { TransactionCategory, TransactionAccount } from '@google-sheets/interfaces';
import { GoogleSheetsService } from '@google-sheets/services';
import { StateManager, STATE_STEPS } from '@state';
import { TelegramInlineKeyboardInterface } from '@telegram-api';

export class CommandService implements AbstractClassService<CommandService> {
  private static instance: CommandService;
  private messageService: MessageService;
  private googleSheetsService: GoogleSheetsService;
  private stateManager: StateManager;

  private constructor() {
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
    this.stateManager = StateManager.getInstance();
  }

  public static getInstance(): CommandService {
    if (!CommandService.instance) {
      CommandService.instance = new CommandService();
    }
    return CommandService.instance;
  }

  public setupBotCommands(): void {
    // Валидация команд
    const validationErrors = this.validateCommands(setupBotCommands);
    if (validationErrors.length > 0) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка установки команд: ${validationErrors.join('\n')}`,
      );

      return;
    }

    const url = `${getApiUrl()}${getToken()}/setMyCommands`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        commands: setupBotCommands,
      }),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        console.log('✅ Команды бота успешно установлены!');
      }
    } catch (error) {
      console.error(
        '❌ Критическая ошибка при установке команд:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  public deleteBotCommands(): void {
    const url = `${getApiUrl()}${getToken()}/deleteMyCommands`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        console.log('✅ Все команды бота удалены');
      }
    } catch (error) {
      console.error(
        '❌ Критическая ошибка при удалении команд:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private validateCommands(commands: BotCommand[]): string[] {
    const errors: string[] = [];

    commands.forEach((cmd, index) => {
      // Проверка названия команды
      if (!/^[a-z0-9_]+$/.test(cmd.command)) {
        errors.push(
          `Команда "${cmd.command}" содержит недопустимые символы. Разрешены только буквы, цифры и подчеркивания`,
        );
      }

      // Проверка длины описания
      if (cmd.description.length > 256) {
        errors.push(
          `Описание команды "${cmd.command}" превышает 256 символов (${cmd.description.length})`,
        );
      }

      // Проверка, что команда не начинается с цифры
      if (/^\d/.test(cmd.command)) {
        errors.push(`Команда "${cmd.command}" не может начинаться с цифры`);
      }

      // Проверка длины названия команды
      if (cmd.command.length > 32) {
        errors.push(`Название команды "${cmd.command}" превышает 32 символа`);
      }
    });

    return errors;
  }

  public createCategoryInlineKeyboard(
    categories: TransactionCategory[],
  ): Array<Array<{ text: string; callback_data: string }>> {
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
    const itemsPerRow = 3; // 3 кнопки в ряду

    for (let i = 0; i < categories.length; i += itemsPerRow) {
      const row: Array<{ text: string; callback_data: string }> = [];

      for (let j = 0; j < itemsPerRow && i + j < categories.length; j++) {
        const category = categories[i + j];
        row.push({
          text: `${category.emoji} ${category.name}`,
          callback_data: `${CALLBACK_COMMANDS.CHOOSE_TRANSACTION_CATEGORY}${category.id}`,
        });
      }

      keyboard.push(row);
    }

    return keyboard;
  }

  public createAccountInlineKeyboard(
    accounts: TransactionAccount[],
  ): Array<Array<{ text: string; callback_data: string }>> {
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
    const itemsPerRow = 2; // 2 кнопки в ряду для счетов

    for (let i = 0; i < accounts.length; i += itemsPerRow) {
      const row: Array<{ text: string; callback_data: string }> = [];

      for (let j = 0; j < itemsPerRow && i + j < accounts.length; j++) {
        const account = accounts[i + j];
        row.push({
          text: `💳 ${account.name} (${account.currency})`,
          callback_data: `${CALLBACK_COMMANDS.CHOOSE_TRANSACTION_ACCOUNT}${account.id}`,
        });
      }

      keyboard.push(row);
    }

    return keyboard;
  }

  public createTransferFromAccountInlineKeyboard(
    accounts: TransactionAccount[],
  ): Array<Array<{ text: string; callback_data: string }>> {
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
    const itemsPerRow = 2; // 2 кнопки в ряду для счетов

    for (let i = 0; i < accounts.length; i += itemsPerRow) {
      const row: Array<{ text: string; callback_data: string }> = [];

      for (let j = 0; j < itemsPerRow && i + j < accounts.length; j++) {
        const account = accounts[i + j];
        row.push({
          text: `💳 ${account.name} (${account.currency})`,
          callback_data: `${CALLBACK_COMMANDS.CHOOSE_TRANSFER_FROM_ACCOUNT}${account.id}`,
        });
      }

      keyboard.push(row);
    }

    return keyboard;
  }

  public createTransferToAccountInlineKeyboard(
    accounts: TransactionAccount[],
  ): Array<Array<{ text: string; callback_data: string }>> {
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
    const itemsPerRow = 2; // 2 кнопки в ряду для счетов

    for (let i = 0; i < accounts.length; i += itemsPerRow) {
      const row: Array<{ text: string; callback_data: string }> = [];

      for (let j = 0; j < itemsPerRow && i + j < accounts.length; j++) {
        const account = accounts[i + j];
        row.push({
          text: `💳 ${account.name} (${account.currency})`,
          callback_data: `${CALLBACK_COMMANDS.CHOOSE_TRANSFER_TO_ACCOUNT}${account.id}`,
        });
      }

      keyboard.push(row);
    }

    return keyboard;
  }

  public handleTransferToAccountChoice(chatId: number, fromAccountId: string): void {
    // Получаем все счета
    const accounts = this.googleSheetsService.getAllAccounts();
    // Исключаем уже выбранный счет списания
    const availableAccounts = accounts.filter((account) => account.id.toString() !== fromAccountId);

    if (availableAccounts.length === 0) {
      this.messageService.sendText(
        chatId,
        `❌ Нет доступных счетов для пополнения. Все остальные счета недоступны.`,
      );
      this.stateManager.updateUserStateStep(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Создаем клавиатуру со счетами для пополнения
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.createTransferToAccountInlineKeyboard(availableAccounts),
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      TEXT_MESSAGES.CHOOSE_TO_ACCOUNT_FOR_TRANSFER,
      keyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_TO_ACCOUNT);
  }
}
