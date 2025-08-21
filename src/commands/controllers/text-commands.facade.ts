import {
  addCategoryTypeInlienKeyboard,
  addTransactionReplyKeyboard,
  confirmInlineKeyboard,
  startMenuReplyKeyboard,
} from '@commands/consts';
import { STATS_PER_PERIOD, TEXT_MESSAGES, TRANSACTION_TYPE } from '@commands';
import { CommandService } from '@commands/services';
import { TransactionAccount, TransactionCategory } from '@google-sheets/interfaces';
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
      `👋 Привет, ${firstName}! Выбери действие:`,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandCancel(chatId: number): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandAddTransactionStart(chatId: number, firstName: string): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_TYPE);
    this.messageService.sendReplyMarkup(
      chatId,
      `☝️ ${firstName}! Выбери тип транзакции:`,
      addTransactionReplyKeyboard,
    );
  }

  public mainCommandAddCategoryStart(chatId: number): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_CATEGORY_NAME);
    this.messageService.sendText(chatId, `📝 Введи название категории:`);
  }

  public mainCommandAddAccountStart(chatId: number): void {
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_ACCOUNT_NAME);
    this.messageService.sendText(chatId, `📝 Введи название счета:`);
  }

  public noSuchCommandFound(chatId: number, text: string): void {
    const trimmedText = text.trim();
    this.messageService.sendText(chatId, `❌ Неизвестная команда: "${trimmedText}"`);
    this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
    this.messageService.sendReplyMarkup(
      chatId,
      TEXT_MESSAGES.RESET_USER_STATE,
      startMenuReplyKeyboard,
    );
  }

  public mainCommandAddTransactionChooseAccount(chatId: number, type: TRANSACTION_TYPE): void {
    // Получаем все счета
    const accounts = this.googleSheetsService.getAllAccounts();

    if (accounts.length === 0) {
      this.messageService.sendText(
        chatId,
        `❌ Счета не найдены. Сначала добавьте счета через /addaccount`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Создаем клавиатуру со счетами
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.commandService.createAccountInlineKeyboard(accounts),
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      TEXT_MESSAGES.CHOOSE_ACCOUNT_FOR_TRANSACTION,
      keyboard,
    );
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_ACCOUNT_TYPE, {
      transactionType: type,
    });
  }

  public handleAddTransactionAmount(chatId: number, text: string): void {
    // Тримим текст перед обработкой
    const trimmedText = text.trim();

    // Извлекаем числовое значение из текста
    const extractedAmount = this.extractNumberFromText(trimmedText);

    if (extractedAmount === null) {
      this.messageService.sendText(
        chatId,
        '❌ Не удалось найти числовое значение. Попробуй еще раз, например: "100" или "50.50"',
      );
      return;
    }

    // Преобразуем число в строку и добавляем в состояние
    const amountString = extractedAmount.toString();
    this.stateManager.updateUserStateData(chatId, { amount: amountString });

    const currentUserState = this.stateManager.getUserState(chatId);
    const data = currentUserState?.data;

    const { transactionType, amount, transactionCategory, transactionAccount } = data as {
      transactionType: TRANSACTION_TYPE;
      amount: string;
      transactionCategory: TransactionCategory;
      transactionAccount: TransactionAccount;
    };

    const transactionComment = data?.transactionComment || '';

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nТип транзакции: ${transactionType} \nСумма: ${amount} \nКатегория: ${transactionCategory.name} \nСчет: ${transactionAccount?.name || 'Неизвестный'} \n${transactionComment.length > 0 ? `Комментарий: ${transactionComment}` : ''}`,
      confirmInlineKeyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_CONFIRM);
  }

  public handleAddTransactionComment(chatId: number, text: string): void {
    const trimmedText = text.trim();
    this.stateManager.updateUserStateData(chatId, { transactionComment: trimmedText ?? '' });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_CONFIRM);

    const data = this.stateManager.getUserState(chatId)?.data;
    const { transactionType, amount, transactionCategory, transactionComment, transactionAccount } =
      data as {
        transactionType: TRANSACTION_TYPE;
        amount: string;
        transactionCategory: TransactionCategory;
        transactionComment: string;
        transactionAccount: TransactionAccount;
      };

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nТип транзакции: ${transactionType} \nСумма: ${amount} \nКатегория: ${transactionCategory.name} \nСчет: ${transactionAccount?.name || 'Неизвестный'} \n${transactionComment.length > 0 ? `Комментарий: ${transactionComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  private extractNumberFromText(text: string): number | null {
    try {
      // Текст уже должен быть тримлен, но на всякий случай еще раз
      const cleanText = text.trim();

      // Заменяем запятые на точки для корректной обработки дробных чисел
      const normalizedText = cleanText.replace(/,/g, '.');

      // Регулярное выражение для поиска чисел (целых и дробных)
      // Поддерживает форматы: 123, 123.45, .45, 0.45
      const numberRegex = /(\d*\.?\d+)/g;

      const matches = normalizedText.match(numberRegex);

      if (!matches || matches.length === 0) {
        return null;
      }

      // Берем первое найденное число
      const firstMatch = matches[0];

      // Преобразуем в число
      const number = parseFloat(firstMatch);

      // Проверяем, что это валидное число
      if (isNaN(number) || !isFinite(number)) {
        return null;
      }

      // Проверяем, что число не отрицательное
      if (number < 0) {
        return null;
      }

      return number;
    } catch (error) {
      console.error('Ошибка при извлечении числа из текста:', error);
      return null;
    }
  }

  public handleAddCategoryName(chatId: number, text: string): void {
    // Тримим текст перед обработкой
    const cleanName = text.trim();

    if (!cleanName) {
      this.messageService.sendText(
        chatId,
        '❌ Название категории не может быть пустым. Попробуй еще раз.',
      );
      return;
    }

    if (cleanName.length > 50) {
      this.messageService.sendText(
        chatId,
        '❌ Название категории слишком длинное. Максимум 50 символов.',
      );
      return;
    }

    this.stateManager.updateUserStateData(chatId, { categoryName: cleanName });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_TYPE);
    this.messageService.sendInlineKeyboard(
      chatId,
      `📝 Введи тип новой категории:`,
      addCategoryTypeInlienKeyboard,
    );
  }

  public handleAddAccountName(chatId: number, text: string): void {
    const cleanName = text.trim();

    if (!cleanName) {
      this.messageService.sendText(
        chatId,
        '❌ Название счета не может быть пустым. Попробуй еще раз.',
      );
      return;
    }

    if (cleanName.length > 50) {
      this.messageService.sendText(
        chatId,
        '❌ Название счета слишком длинное. Максимум 50 символов.',
      );
      return;
    }
    this.stateManager.updateUserStateData(chatId, { accountName: cleanName });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_ACCOUNT_CURRENCY);
    this.messageService.sendText(chatId, `📝 Введи валюту счета:`);
  }

  public handleAddAccountCurrency(chatId: number, text: string): void {
    const cleanCurrency = text.trim();

    if (!cleanCurrency) {
      this.messageService.sendText(chatId, '❌ Валюта не может быть пустой. Попробуй еще раз.');
      return;
    }

    if (cleanCurrency.length > 3) {
      this.messageService.sendText(chatId, '❌ Валюта слишком длинная. Максимум 3 символа.');
      return;
    }
    this.stateManager.updateUserStateData(chatId, { accountCurrency: cleanCurrency });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_ACCOUNT_AMOUNT);
    this.messageService.sendText(chatId, `📝 Введи текущий баланс счета:`);
  }

  public handleAddAccountAmount(chatId: number, text: string): void {
    const cleanAmount = text.trim();
    const extractedAmount = this.extractNumberFromText(cleanAmount);

    if (extractedAmount === null) {
      this.messageService.sendText(
        chatId,
        '❌ Не удалось найти числовое значение. Попробуй еще раз, например: "100" или "50.50"',
      );
      return;
    }

    const amountString = extractedAmount.toString();
    this.stateManager.updateUserStateData(chatId, { accountAmount: amountString });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_ACCOUNT_CONFIRM);

    const currentUserState = this.stateManager.getUserState(chatId);
    const data = currentUserState?.data;

    const { accountName, accountCurrency, accountAmount } = data as {
      accountName: string;
      accountCurrency: string;
      accountAmount: string;
    };

    const accountComment = data?.accountComment || '';

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nНазвание: ${accountName} \nВалюта: ${accountCurrency} \nБаланс: ${accountAmount} \n${accountComment.length > 0 ? `Комментарий: ${accountComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  public handleAddAccountComment(chatId: number, text: string): void {
    const trimmedText = text.trim();
    this.stateManager.updateUserStateData(chatId, { accountComment: trimmedText ?? '' });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_ACCOUNT_CONFIRM);

    const data = this.stateManager.getUserState(chatId)?.data;
    const { accountName, accountCurrency, accountAmount, accountComment } = data as {
      accountName: string;
      accountCurrency: string;
      accountAmount: string;
      accountComment: string;
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nНазвание: ${accountName} \nВалюта: ${accountCurrency} \nБаланс: ${accountAmount} \n${accountComment.length > 0 ? `Комментарий: ${accountComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  public handleAddCategoryEmoji(chatId: number, text: string): void {
    // Тримим текст перед обработкой
    const cleanEmoji = text.trim();

    if (!cleanEmoji) {
      this.messageService.sendText(
        chatId,
        '❌ Эмодзи не может быть пустым. Попробуй еще раз, например: "💰" или "🍕"',
      );
      return;
    }

    this.stateManager.updateUserStateData(chatId, { categoryEmoji: cleanEmoji });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_CONFIRM);

    const currentUserState = this.stateManager.getUserState(chatId);
    const data = currentUserState?.data;

    const { categoryName, categoryType, categoryEmoji } = data as {
      categoryName: string;
      categoryType: TRANSACTION_TYPE;
      categoryEmoji: string;
    };

    const categoryComment = data?.categoryComment || '';

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nНазвание: ${categoryName} \nТип: ${categoryType} \nЭмодзи: ${categoryEmoji} \n${categoryComment.length > 0 ? `Комментарий: ${categoryComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  public handleAddCategoryComment(chatId: number, text: string): void {
    const trimmedText = text.trim();
    this.stateManager.updateUserStateData(chatId, { categoryComment: trimmedText ?? '' });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_CONFIRM);

    const data = this.stateManager.getUserState(chatId)?.data;

    const { categoryName, categoryType, categoryEmoji, categoryComment } = data as {
      categoryName: string;
      categoryType: TRANSACTION_TYPE;
      categoryEmoji: string;
      categoryComment: string;
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные: \nНазвание: ${categoryName} \nТип: ${categoryType} \nЭмодзи: ${categoryEmoji} \n${categoryComment.length > 0 ? `Комментарий: ${categoryComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  public mainCommandAddTransferStart(chatId: number): void {
    // Получаем все счета
    const accounts = this.googleSheetsService.getAllAccounts();

    if (accounts.length === 0) {
      this.messageService.sendText(
        chatId,
        `❌ Счета не найдены. Сначала добавьте счета через /addaccount`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    if (accounts.length < 2) {
      this.messageService.sendText(
        chatId,
        `❌ Для трансфера нужно минимум 2 счета. Добавьте еще счета через /addaccount`,
      );
      this.stateManager.setUserState(chatId, STATE_STEPS.DEFAULT);
      return;
    }

    // Создаем клавиатуру со счетами для списания
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.commandService.createTransferFromAccountInlineKeyboard(accounts),
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      TEXT_MESSAGES.CHOOSE_FROM_ACCOUNT_FOR_TRANSFER,
      keyboard,
    );
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSFER_FROM_ACCOUNT);
  }

  public handleAddTransferAmount(chatId: number, text: string): void {
    const trimmedText = text.trim();
    const extractedAmount = this.extractNumberFromText(trimmedText);

    if (extractedAmount === null) {
      this.messageService.sendText(
        chatId,
        '❌ Не удалось найти числовое значение. Попробуй еще раз, например: "100" или "50.50"',
      );
      return;
    }

    const amountString = extractedAmount.toString();
    this.stateManager.updateUserStateData(chatId, { transferAmount: amountString });

    const currentUserState = this.stateManager.getUserState(chatId);
    const data = currentUserState?.data;

    const { transferFromAccount, transferToAccount, transferAmount } = data as {
      transferFromAccount: TransactionAccount;
      transferToAccount: TransactionAccount;
      transferAmount: string;
    };

    const transferComment = data?.transferComment || '';

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные трансфера: \nСо счета: ${transferFromAccount.name} \nНа счет: ${transferToAccount.name} \nСумма: ${transferAmount} \n${transferComment.length > 0 ? `Комментарий: ${transferComment}` : ''}`,
      confirmInlineKeyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_CONFIRM);
  }

  public handleAddTransferComment(chatId: number, text: string): void {
    const trimmedText = text.trim();
    this.stateManager.updateUserStateData(chatId, { transferComment: trimmedText ?? '' });
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSFER_CONFIRM);

    const data = this.stateManager.getUserState(chatId)?.data;
    const { transferFromAccount, transferToAccount, transferAmount, transferComment } = data as {
      transferFromAccount: TransactionAccount;
      transferToAccount: TransactionAccount;
      transferAmount: string;
      transferComment: string;
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверьте данные трансфера: \nСо счета: ${transferFromAccount.name} \nНа счет: ${transferToAccount.name} \nСумма: ${transferAmount} \n${transferComment.length > 0 ? `Комментарий: ${transferComment}` : ''}`,
      confirmInlineKeyboard,
    );
  }

  public mainCommandStatsPerPeriod(chatId: number, period: STATS_PER_PERIOD): void {
    try {
      if (period === STATS_PER_PERIOD.DAY) {
        this.showStatsPerPeriod(chatId, period);
      } else if (period === STATS_PER_PERIOD.WEEK) {
        this.showStatsPerPeriod(chatId, period);
      } else if (period === STATS_PER_PERIOD.TWO_WEEKS) {
        this.showStatsPerPeriod(chatId, period);
      } else if (period === STATS_PER_PERIOD.MONTH) {
        this.showStatsPerPeriod(chatId, period);
      } else if (period === STATS_PER_PERIOD.THIRTY_DAYS) {
        this.showStatsPerPeriod(chatId, period);
      } else {
        this.messageService.sendText(chatId, '❌ Неизвестный период для статистики');
      }
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при получении статистики: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private showStatsPerPeriod(chatId: number, period: STATS_PER_PERIOD): void {
    try {
      // Получаем все транзакции
      const allTransactions = this.googleSheetsService.getAllTransactions();

      if (allTransactions.length === 0) {
        this.messageService.sendText(chatId, '📊 Транзакций пока нет');
        return;
      }

      // Определяем диапазон дат для фильтрации
      const { startDate, endDate, periodTitle } = this.getDateRangeForPeriod(period);

      // Фильтруем транзакции по диапазону дат (индекс 4 - дата) и исключаем трансферы и операции с валютой
      const filteredTransactions = allTransactions.filter((transaction) => {
        const transactionDateString = transaction[4]; // Дата находится под индексом 4
        const transactionDate = this.parseDate(transactionDateString);
        const category = transaction[3]; // Категория (индекс 3)

        if (!transactionDate) return false;

        // Исключаем трансферы и операции с валютой по названию категории
        if (
          category === 'Трансфер списание' ||
          category === 'Трансфер пополнение' ||
          category === 'Продажа валюты' ||
          category === 'Покупка валюты'
        ) {
          return false;
        }

        return transactionDate >= startDate && transactionDate <= endDate;
      });

      if (filteredTransactions.length === 0) {
        this.messageService.sendText(chatId, `📊 Транзакций за ${periodTitle} нет`);
        return;
      }

      // Подсчитываем дельту
      let totalDelta = 0;
      let incomeTotal = 0;
      let expenseTotal = 0;

      const categoriesSummary: { [key: string]: { amount: number; type: string } } = {};

      filteredTransactions.forEach((transaction) => {
        const transactionType = transaction[1]; // Тип транзакции (индекс 1)
        const amount = parseFloat(transaction[2]); // Сумма (индекс 2)
        const category = transaction[3]; // Категория (индекс 3)

        if (transactionType === TRANSACTION_TYPE.INCOME) {
          totalDelta += amount;
          incomeTotal += amount;
        } else if (transactionType === TRANSACTION_TYPE.EXPENSE) {
          totalDelta -= amount;
          expenseTotal += amount;
        }

        // Группируем по категориям с учетом типа (исключаем трансферы и операции с валютой)
        if (
          category !== 'Трансфер списание' &&
          category !== 'Трансфер пополнение' &&
          category !== 'Продажа валюты' &&
          category !== 'Покупка валюты'
        ) {
          if (categoriesSummary[category]) {
            categoriesSummary[category].amount += amount;
          } else {
            categoriesSummary[category] = {
              amount: amount,
              type: transactionType,
            };
          }
        }
      });

      // Формируем сообщение с результатами
      let statsMessage = `📊 *Статистика за ${periodTitle}*\n\n`;

      // Общая информация
      statsMessage += `💰 *Общая дельта:* ${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(2)} BYN\n`;
      statsMessage += `💵 *Доходы:* +${incomeTotal.toFixed(2)} BYN\n`;
      statsMessage += `💸 *Расходы:* -${expenseTotal.toFixed(2)} BYN\n`;
      statsMessage += `📋 *Всего транзакций:* ${filteredTransactions.length} шт.\n\n`;

      // Статистика по категориям
      if (Object.keys(categoriesSummary).length > 0) {
        statsMessage += `📂 *По категориям:*\n`;
        Object.entries(categoriesSummary)
          .sort(([, a], [, b]) => b.amount - a.amount) // Сортируем по убыванию суммы
          .forEach(([category, data]) => {
            const sign =
              data.type === TRANSACTION_TYPE.INCOME
                ? '+'
                : data.type === TRANSACTION_TYPE.EXPENSE
                  ? '-'
                  : '';
            statsMessage += `  • ${category}: ${sign}${data.amount.toFixed(2)} BYN\n`;
          });
      }

      this.messageService.sendText(chatId, statsMessage);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при подсчете статистики: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getDateRangeForPeriod(period: STATS_PER_PERIOD): {
    startDate: Date;
    endDate: Date;
    periodTitle: string;
  } {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // Конец дня

    let startDate: Date;
    let periodTitle: string;

    switch (period) {
      case STATS_PER_PERIOD.DAY:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0); // Начало дня
        periodTitle = `сегодня (${Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd.MM.yyyy')})`;
        break;

      case STATS_PER_PERIOD.WEEK:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // 7 дней назад (включая сегодня)
        startDate.setHours(0, 0, 0, 0);
        periodTitle = `неделю (${Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')} - ${Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')})`;
        break;

      case STATS_PER_PERIOD.TWO_WEEKS:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 13); // 14 дней назад (включая сегодня)
        startDate.setHours(0, 0, 0, 0);
        periodTitle = `2 недели (${Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')} - ${Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')})`;
        break;

      case STATS_PER_PERIOD.MONTH:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Первый день текущего месяца
        startDate.setHours(0, 0, 0, 0);
        periodTitle = `месяц (${Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')} - ${Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')})`;
        break;

      case STATS_PER_PERIOD.THIRTY_DAYS:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29); // 30 дней назад (включая сегодня)
        startDate.setHours(0, 0, 0, 0);
        periodTitle = `30 дней (${Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')} - ${Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'dd.MM.yyyy')})`;
        break;

      default:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        periodTitle = 'неизвестный период';
        break;
    }

    return { startDate, endDate, periodTitle };
  }

  private parseDate(dateString: string): Date | null {
    try {
      // Ожидаем формат dd.MM.yyyy
      const parts = dateString.split('.');
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Месяцы в JavaScript начинаются с 0
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

      const date = new Date(year, month, day);

      // Проверяем валидность даты
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return null;
      }

      return date;
    } catch (error) {
      return null;
    }
  }

  public mainCommandAccountBalances(chatId: number): void {
    try {
      const accounts = this.googleSheetsService.getAllAccounts();

      if (accounts.length === 0) {
        this.messageService.sendText(
          chatId,
          '❌ Счета не найдены. Сначала добавьте счета через /addaccount',
        );
        return;
      }

      let balancesMessage = '💰 *Балансы счетов:*\n\n';

      accounts.forEach((account) => {
        const balance = parseFloat(account.currentBalance);
        const formattedBalance = balance.toFixed(2).replace('.', ',');
        balancesMessage += `💳 *${account.name}*: ${formattedBalance} ${account.currency}\n`;
      });

      this.messageService.sendText(chatId, balancesMessage);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при получении балансов счетов: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public mainCommandTransactionCategories(chatId: number): void {
    try {
      // Получаем категории доходов и расходов
      const incomeCategories = this.googleSheetsService.getCategoriesByType(
        TRANSACTION_TYPE.INCOME,
      );
      const expenseCategories = this.googleSheetsService.getCategoriesByType(
        TRANSACTION_TYPE.EXPENSE,
      );

      if (incomeCategories.length === 0 && expenseCategories.length === 0) {
        this.messageService.sendText(
          chatId,
          '❌ Категории не найдены. Сначала добавьте категории через /addcategory',
        );
        return;
      }

      let categoriesMessage = '📝 *Список категорий:*\n\n';

      // Добавляем категории доходов
      if (incomeCategories.length > 0) {
        categoriesMessage += '💵 *Доходы:*\n';
        incomeCategories.forEach((category) => {
          categoriesMessage += `${category.emoji} ${category.name}\n`;
        });
        categoriesMessage += '\n';
      }

      // Добавляем категории расходов
      if (expenseCategories.length > 0) {
        categoriesMessage += '💸 *Расходы:*\n';
        expenseCategories.forEach((category) => {
          categoriesMessage += `${category.emoji} ${category.name}\n`;
        });
      }

      this.messageService.sendText(chatId, categoriesMessage);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при получении списка категорий: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
