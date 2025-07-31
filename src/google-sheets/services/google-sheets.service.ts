import { MessageService } from '@messages';
import {
  TransactionResult,
  CategoryResult,
  TransactionCategory,
  TransactionAccount,
  AccountResult,
} from '@google-sheets/interfaces';
import { AbstractClassService, getAdminId, getSpreadsheetId } from '@shared';
import { TRANSACTION_TYPE } from '@commands/enums';
import { GOOGLE_SHEETS_NAMES } from '@google-sheets/consts/google-sheets.consts';

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

  public getNextTransactionId(): number {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTIONS);

      if (!sheet) {
        return 0;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return 0; // Если таблица пустая или только заголовки, начинаем с 0
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
        Number(getAdminId()),
        `❌ Ошибка при получении следующего ID транзакции: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  public addTransaction(
    transactionType: string,
    amount: string,
    transactionCategory: string,
    transactionComment: string,
    chatId: string,
    firstName: string,
    accountName: string,
    accountId: string,
  ): TransactionResult {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTIONS);

      if (!sheet) {
        return {
          success: false,
          error: 'Лист Transactions не найден',
        };
      }

      // Получаем текущий баланс счета
      const account = this.getAccountById(accountId);
      if (!account) {
        return {
          success: false,
          error: `Счет с ID ${accountId} не найден`,
        };
      }

      const currentBalance = parseFloat(account.currentBalance);
      const transactionAmount = parseFloat(amount);

      // Вычисляем новый баланс в зависимости от типа транзакции
      let newBalance: number;
      if (transactionType === 'income') {
        newBalance = currentBalance + transactionAmount;
      } else if (transactionType === 'expense') {
        newBalance = currentBalance - transactionAmount;
      } else {
        newBalance = currentBalance; // Для transfer логика обрабатывается отдельно
      }

      // Получаем следующий ID транзакции
      const nextId = this.getNextTransactionId();

      // Получаем текущую дату и время
      const now = new Date();
      const date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy');
      const time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

      // Находим первую свободную строку
      const nextRow = sheet.getLastRow() + 1;

      // Подготавливаем данные для записи в порядке: id, transactionType, amount, transactionCategory, date, time, comment, chatId, firstName, accountName, accountId, balanceBefore, balanceAfter
      const rowData: [
        number,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ] = [
        nextId, // ID
        transactionType, // Тип транзакции
        amount, // Сумма
        transactionCategory, // Категория
        date, // Дата
        time, // Время
        transactionComment, // Комментарий
        chatId, // ID чата
        firstName, // Имя пользователя
        accountName, // Название счета
        accountId, // ID счета
        currentBalance.toString(), // Баланс до транзакции
        newBalance.toString(), // Баланс после транзакции
      ];

      // Записываем данные в строку
      sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);

      // Обновляем баланс счета
      const balanceUpdateSuccess = this.updateAccountBalance(accountId, newBalance.toString());

      if (!balanceUpdateSuccess) {
        return {
          success: false,
          error: 'Ошибка при обновлении баланса счета',
        };
      }

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
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES);

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
        Number(getAdminId()),
        `❌ Ошибка при получении следующего ID категории: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  public getNextAccountId(): number {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

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
        Number(getAdminId()),
        `❌ Ошибка при получении следующего ID счета: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  public addCategory(
    name: string,
    type: TRANSACTION_TYPE,
    emoji: string,
    comment: string,
  ): CategoryResult {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES);

      if (!sheet) {
        return {
          success: false,
          error: `Лист ${GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES} не найден`,
        };
      }

      // Проверяем существование категории с таким же именем и типом
      if (this.isCategoryExists(name, type)) {
        return {
          success: false,
          error: `Категория "${name}" для типа "${type}" уже существует`,
        };
      }

      // Получаем следующий ID категории
      const nextId = this.getNextCategoryId();

      // Находим первую свободную строку
      const nextRow = sheet.getLastRow() + 1;

      // Подготавливаем данные для записи в порядке: id, name, type, emoji
      const rowData: [number, string, string, string, string] = [
        nextId, // ID
        name, // Название
        type, // Тип (income/expense/transfer)
        emoji, // Эмодзи
        comment, // Комментарий
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
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES);

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
        Number(getAdminId()),
        `❌ Ошибка при получении категорий по типу ${type}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public getCategoryById(categoryId: string): TransactionCategory | null {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES);

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
        Number(getAdminId()),
        `❌ Ошибка при получении категории по ID ${categoryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public getAccountById(accountId: string): TransactionAccount | null {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

      if (!sheet) {
        return null;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return null; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, currency, currentBalance, accountComment)
      const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

      // Ищем счет по ID
      const accountRow = data.find((row) => row[0].toString() === accountId);

      if (!accountRow) {
        return null; // Счет не найден
      }

      // Возвращаем найденный счет
      return {
        id: accountRow[0] as number,
        name: accountRow[1] as string,
        currency: accountRow[2] as string,
        currentBalance: accountRow[3] as string,
        accountComment: accountRow[4] as string,
      };
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при получении счета по ID ${accountId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public getAllAccounts(): TransactionAccount[] {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

      if (!sheet) {
        return [];
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return []; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, currency, currentBalance, accountComment)
      const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

      // Преобразуем данные в массив объектов Account
      const accounts: TransactionAccount[] = data
        .filter((row) => row[0] !== '' && row[0] !== null) // Фильтруем пустые строки
        .map((row) => ({
          id: row[0] as number,
          name: row[1] as string,
          currency: row[2] as string,
          currentBalance: row[3] as string,
          accountComment: row[4] as string,
        }));

      return accounts;
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при получении всех счетов: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public isCategoryExists(name: string, type: TRANSACTION_TYPE): boolean {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTION_CATEGORIES);

      if (!sheet) {
        return false;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return false; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, type, emoji)
      const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

      // Проверяем существование категории с таким же именем и типом
      const existingCategory = data.find(
        (row) => row[1].toLowerCase() === name.toLowerCase() && row[2] === type,
      );

      return !!existingCategory;
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при проверке существования категории: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  public connectToGoogleSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet | null {
    const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId()!);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Лист "${sheetName}" не найден в таблице`,
      );
      return null;
    }

    return sheet;
  }

  public isAccountExists(accountName: string): boolean {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

      if (!sheet) {
        return false;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return false; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки (id, name, currency, currentBalance)
      const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

      // Проверяем существование счета с таким же именем
      const existingAccount = data.find(
        (row) => row[1].toLowerCase() === accountName.toLowerCase(),
      );

      return !!existingAccount;
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при проверке существования счета: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  public updateAccountBalance(accountId: string, newBalance: string): boolean {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

      if (!sheet) {
        return false;
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return false; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки
      const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

      // Ищем строку с нужным ID счета
      for (let i = 0; i < data.length; i++) {
        if (data[i][0].toString() === accountId) {
          // Обновляем баланс (колонка 4, индекс 3)
          const rowNumber = i + 2; // +2 потому что начинаем с 2-й строки
          sheet.getRange(rowNumber, 4).setValue(newBalance);
          return true;
        }
      }

      return false; // Счет не найден
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при обновлении баланса счета ${accountId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  public getAllTransactions(): any[] {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.TRANSACTIONS);

      if (!sheet) {
        return [];
      }

      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return []; // Если таблица пустая или только заголовки
      }

      // Получаем все данные начиная со 2-й строки
      // Структура: id, transactionType, amount, transactionCategory, date, time, comment, chatId, firstName, accountName, accountId, balanceBefore, balanceAfter
      const data = sheet.getRange(2, 1, lastRow - 1, 13).getValues();

      return data.filter((row) => row[0] !== '' && row[0] !== null); // Фильтруем пустые строки
    } catch (error) {
      this.messageService.sendText(
        Number(getAdminId()),
        `❌ Ошибка при получении транзакций: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public addAccount(
    accountName: string,
    accountCurrency: string,
    accountAmount: string,
    comment: string,
  ): AccountResult {
    try {
      const sheet = this.connectToGoogleSheet(GOOGLE_SHEETS_NAMES.ACCOUNTS);

      if (!sheet) {
        return {
          success: false,
          error: `Лист ${GOOGLE_SHEETS_NAMES.ACCOUNTS} не найден`,
        };
      }

      // Проверяем существование счета с таким же именем
      if (this.isAccountExists(accountName)) {
        return {
          success: false,
          error: `Счет "${accountName}" уже существует`,
        };
      }

      // Получаем следующий ID счета
      const nextId = this.getNextAccountId();

      // Находим первую свободную строку
      const nextRow = sheet.getLastRow() + 1;

      // Подготавливаем данные для записи в порядке: id, name, currency, currentBalance
      const rowData: [number, string, string, string, string] = [
        nextId, // ID
        accountName, // Название счета
        accountCurrency, // Валюта
        accountAmount, // Текущий баланс
        comment, // Комментарий
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
}
