import { CONFIG } from '@config';
import { BotCommand, MAIN_COMMANDS } from '@commands';
import { MessageService } from '@messages';
import { AbstractClassService } from '@shared';

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
    const commands: BotCommand[] = [
      {
        command: MAIN_COMMANDS.START,
        description: 'Начало работы с ботом',
      },
      {
        command: MAIN_COMMANDS.ADDTRANSACTION,
        description: 'Добавить новую транзакцию в таблицу',
      },
      {
        command: MAIN_COMMANDS.ADDCATEGORY,
        description: 'Добавить новую категорию транзакций',
      },
    ];

    // Валидация команд
    const validationErrors = this.validateCommands(commands);
    if (validationErrors.length > 0) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка установки команд: ${validationErrors.join('\n')}`,
      );

      return;
    }

    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setMyCommands`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        commands: commands,
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
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteMyCommands`;

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
}
