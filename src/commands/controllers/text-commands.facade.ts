import {
  addCategoryTypeInlienKeyboard,
  addTransactionReplyKeyboard,
  confirmInlineKeyboard,
  startMenuReplyKeyboard,
} from '@commands/consts';
import { TEXT_MESSAGES, TRANSACTION_TYPE } from '@commands';
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
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_TYPE);
    this.messageService.sendReplyMarkup(
      chatId,
      `☝️ ${firstName}! Выбери тип транзакции:`,
      addTransactionReplyKeyboard,
    );
  }

  public mainCommandAddCategoryStart(chatId: number): void {
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_CATEGORY_NAME);
    this.messageService.sendText(chatId, `📝 Введи название категории:`);
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

    // Создаем клавиатуру с категориями
    const keyboard: TelegramInlineKeyboardInterface = {
      inline_keyboard: this.commandService.createCategoryInlineKeyboard(categories),
    };

    this.messageService.sendInlineKeyboard(chatId, `☝️ Выбери категорию`, keyboard);
    this.stateManager.setUserState(chatId, STATE_STEPS.ADD_TRANSACTION_CATEGORY_TYPE, {
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

    const { transactionType, amount, transactionCategory } = data as {
      transactionType: TRANSACTION_TYPE;
      amount: string;
      transactionCategory: TransactionCategory;
    };

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверь данные: \nТип транзакции: ${transactionType} \nСумма: ${amount} \nКатегория: ${transactionCategory.name}`,
      confirmInlineKeyboard,
    );
    this.stateManager.updateUserStateStep(chatId, STATE_STEPS.ADD_TRANSACTION_CONFIRM);
  }

  /**
   * Извлекает числовое значение из текста
   * Поддерживает целые и дробные числа, заменяет запятые на точки
   * @param text - исходный текст
   * @returns число или null если число не найдено
   */
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

      // Проверяем, что число положительное
      if (number <= 0) {
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

    this.messageService.sendInlineKeyboard(
      chatId,
      `✅ Проверь данные: \nНазвание: ${categoryName} \nТип: ${categoryType} \nЭмодзи: ${categoryEmoji}`,
      confirmInlineKeyboard,
    );
  }
}
