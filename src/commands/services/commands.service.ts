import { BotCommand, CALLBACK_COMMANDS, setupBotCommands } from '@commands';
import { MessageService } from '@messages';
import { AbstractClassService, getAdminId, getApiUrl, getToken } from '@shared';
import { TransactionCategory, TransactionAccount } from '@google-sheets/interfaces';

export class CommandService implements AbstractClassService<CommandService> {
  private static instance: CommandService;
  private messageService: MessageService;

  private constructor() {
    this.messageService = MessageService.getInstance();
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
}
