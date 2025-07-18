import { CONFIG } from '@config';
import { MessageService } from '@messages';
import { TransactionResult, CategoryResult, TransactionCategory } from '@google-sheets/interfaces';
import { AbstractClassService } from '@shared';
import { TRANSACTION_TYPE } from '@commands/enums';

export class GoogleSheetsService implements AbstractClassService<GoogleSheetsService> {
  private static instance: GoogleSheetsService;
  private messageService: MessageService;

  private constructor() {
    this.messageService = MessageService.getInstance();
  }

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  public addTransaction(
    description: string,
    amount: number,
    category: string = 'Прочее',
  ): TransactionResult {
    try {
      const sheet = this.connectToGoogleSheet('Transactions');

      if (!sheet) {
        return {
          success: false,
          error: 'Лист Transactions не найден',
        };
      }

      // Получаем текущую дату и время
      const now = new Date();
      const date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy');
      const time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

      // Находим первую свободную строку
      const nextRow = sheet.getLastRow() + 1;

      // Подготавливаем данные для записи
      const rowData: [string, string, string, number, string] = [
        date, // Дата
        time, // Время
        description, // Описание
        amount, // Сумма
        category, // Категория
      ];

      // Записываем данные в строку
      sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);

      return {
        success: true,
        row: nextRow,
        data: rowData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public getNextCategoryId(): number {
    try {
      const sheet = this.connectToGoogleSheet('TransactionCategories');

      if (!sheet) {
        return 0;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return 0; // Если таблица пустая, начинаем с 0
      }

      // Получаем все ID из первой колонки (начиная со 2-й строки)
      const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const ids = idColumn.map((row) => row[0]).filter((id) => id !== '' && id !== null);

      if (ids.length === 0) {
        return 0;
      }

      // Находим максимальный ID и инкрементируем
      const maxId = Math.max(...ids);
      return maxId + 1;
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка при получении следующего ID категории: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  public addCategory(name: string, type: string, emoji: string): CategoryResult {
    try {
      const sheet = this.connectToGoogleSheet('TransactionCategories');

      if (!sheet) {
        return {
          success: false,
          error: 'Лист TransactionCategories не найден',
        };
      }

      // Находим первую свободную строку
      const nextRow = sheet.getLastRow() + 1;

      // Подготавливаем данные для записи
      const rowData: [number, string, string, string] = [
        this.getNextCategoryId(), // ID
        name, // Название
        type, // Тип (income/expense/transfer)
        emoji, // Эмодзи
      ];

      // Записываем данные в строку
      sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);

      return {
        success: true,
        row: nextRow,
        data: rowData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public getCategoriesByType(type: TRANSACTION_TYPE): TransactionCategory[] {
    try {
      const sheet = this.connectToGoogleSheet('TransactionCategories');

      if (!sheet) {
        return [];
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return []; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, type, emoji)
      const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

      // Фильтруем категории по типу
      const filteredCategories: TransactionCategory[] = data
        .filter((row) => row[2] === type) // type находится в 3-й колонке (индекс 2)
        .map((row) => ({
          id: row[0] as number,
          name: row[1] as string,
          type: row[2] as string,
          emoji: row[3] as string,
        }));

      return filteredCategories;
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка при получении категорий по типу ${type}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public getCategoryById(categoryId: string): TransactionCategory | null {
    try {
      const sheet = this.connectToGoogleSheet('TransactionCategories');

      if (!sheet) {
        return null;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return null; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, type, emoji)
      const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

      // Ищем категорию по ID
      const categoryRow = data.find((row) => row[0].toString() === categoryId);

      if (!categoryRow) {
        return null; // Категория не найдена
      }

      // Возвращаем найденную категорию
      return {
        id: categoryRow[0] as number,
        name: categoryRow[1] as string,
        type: categoryRow[2] as string,
        emoji: categoryRow[3] as string,
      };
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка при получении категории по ID ${categoryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public connectToGoogleSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet | null {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Лист "${sheetName}" не найден в таблице`,
      );
      return null;
    }

    return sheet;
  }
}
