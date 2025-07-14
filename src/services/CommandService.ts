import { CONFIG } from '../config';
import { BotCommand } from '../types';
export class CommandService {
  private static instance: CommandService;

  public static getInstance(): CommandService {
    if (!CommandService.instance) {
      CommandService.instance = new CommandService();
    }
    return CommandService.instance;
  }

  public setupBotCommands(): void {
    const commands: BotCommand[] = [
      {
        command: 'start',
        description: 'Приветствие и краткое описание функционала',
      },
      {
        command: 'help',
        description: 'Список всех команд и инструкции по использованию',
      },
      {
        command: 'menu',
        description: 'Основное меню с кнопками быстрого доступа',
      },
      {
        command: 'add',
        description: 'Добавить новую транзакцию в таблицу',
      },
      {
        command: 'addcategory',
        description: 'Добавить новую категорию транзакций',
      },
    ];

    // Валидация команд
    const validationErrors = this.validateCommands(commands);
    if (validationErrors.length > 0) {
      console.error('❌ Ошибки валидации команд:');
      validationErrors.forEach((error) => console.error(`  - ${error}`));
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
        console.log('Доступные команды:');
        commands.forEach((cmd) => {
          console.log(`/${cmd.command} - ${cmd.description}`);
        });
      } else {
        console.error('❌ Ошибка установки команд:', result.description);
      }
    } catch (error) {
      console.error(
        '❌ Критическая ошибка при установке команд:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  public getBotCommands(): void {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getMyCommands`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        console.log('📋 Установленные команды:');
        if (result.result.length === 0) {
          console.log('Команды не установлены');
        } else {
          result.result.forEach((cmd: BotCommand) => {
            console.log(`/${cmd.command} - ${cmd.description}`);
          });
        }
      } else {
        console.error('❌ Ошибка получения команд:', result.description);
      }
    } catch (error) {
      console.error(
        '❌ Критическая ошибка при получении команд:',
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
      } else {
        console.error('❌ Ошибка удаления команд:', result.description);
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
