import { CONFIG } from '@config';
import {
  Keyboard,
  StateManager,
  CategoryAddStepsCallBack,
  CategoryTypeCallBack,
  KeyboardCancelCallBack,
  UserState,
} from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { Message } from '@telegram-api';
import { AbstractClassService } from '@shared';
import { CategoryType, USERS_ID } from '@commands';
export class TextCommandsController implements AbstractClassService<TextCommandsController> {
  private static instance: TextCommandsController;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  private readonly googleSheetsService: GoogleSheetsService;

  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.messageService = MessageService.getInstance();
    this.googleSheetsService = GoogleSheetsService.getInstance();
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
      case '/start':
        this.messageService.sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
        break;

      case '/help':
        this.messageService.sendText(
          chatId,
          'Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню\n/add - добавить транзакцию\n/addcategory - добавить категорию',
        );
        break;

      case '/menu':
        this.messageService.sendMenu(chatId);
        break;

      case '/addtransaction':
        this.handleAddTransaction(chatId, firstName);
        break;

      case '/addcategory':
        this.handleAddCategoryStart(chatId, firstName);
        break;

      default:
        // Проверяем, находится ли пользователь в процессе добавления категории
        const currentState = this.stateManager.getUserState(chatId);
        this.messageService.sendText(chatId, JSON.stringify(currentState));
        if (currentState) {
          if (currentState.step === CategoryAddStepsCallBack.ADD_CATEGORY_NAME) {
            this.handleCategoryNameInput(chatId, text);
            return;
          }
          if (currentState.step === CategoryAddStepsCallBack.ADD_CATEGORY_EMOJI) {
            this.handleCategoryEmojiInput(chatId, text);
            return;
          }
        }

        if (this.stateManager.isUserInSteps(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_NAME)) {
          this.handleCategoryNameInput(chatId, text);
        } else if (
          this.stateManager.isUserInSteps(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_EMOJI)
        ) {
          this.handleCategoryEmojiInput(chatId, text);
        } else {
          // Эхо-ответ
          this.messageService.sendText(chatId, `Эхо: "${text}"`);
        }
    }
  }

  private handleAddTransaction(chatId: number, firstName: string): void {
    const description = 'Test transaction';
    const category = 'Test category';
    const amount = Math.floor(Math.random() * 5000) + 100; // от 100 до 5100

    try {
      // Добавляем транзакцию в Google Sheets
      const result = this.googleSheetsService.addTransaction(description, amount, category);

      if (result.success && result.data) {
        const date = `${result.data?.[0] ?? ''}`;
        const time = `${result.data?.[1] ?? ''}`;
        const message =
          `✅ Транзакция успешно добавлена!\n\n` +
          `📝 Описание: ${description}\n` +
          `💰 Сумма: ${amount} руб.\n` +
          `📂 Категория: ${category}\n` +
          `📅 Дата: ${date}\n` +
          `🕐 Время: ${time}\n` +
          `📊 Строка: ${result.row || 'Не указана'}`;

        this.messageService.sendText(chatId, message);
      } else {
        this.messageService.sendText(
          chatId,
          `❌ Ошибка при добавлении транзакции: ${result.error || 'Неизвестная ошибка'}`,
        );
      }
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка в handleAddTransaction: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleAddCategoryStart(chatId: number, firstName: string): void {
    if (this.stateManager.isUserInCache(chatId)) {
      this.stateManager.clearUserState(chatId);
    }

    try {
      // Устанавливаем состояние пользователя
      this.stateManager.setUserState(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_NAME);

      const message = `📝 Введите название категории:`;

      this.messageService.sendText(chatId, message);
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в handleAddCategoryStart для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleCategoryNameInput(chatId: number, name: string): void {
    try {
      const state = this.stateManager.getUserState(chatId);
      if (!state) {
        this.messageService.sendText(
          chatId,
          '❌ Состояние пользователя не найдено. Начните заново с /addcategory',
        );
        return;
      }
      // Обновляем состояние с названием
      this.stateManager.updateUserStateData(chatId, { name: name });

      // Переходим к выбору типа (обновляем только тип, сохраняя данные)
      this.stateManager.updateUserStep(chatId, CategoryAddStepsCallBack.ADD_CATEGORY_TYPE);

      const message = `✅ Название сохранено: "${name}"`;

      const keyboard: Keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Доход', callback_data: CategoryTypeCallBack.INCOME },
            { text: '💸 Расход', callback_data: CategoryTypeCallBack.EXPENSE },
            { text: '🔄 Перевод', callback_data: CategoryTypeCallBack.TRANSFER },
          ],
          [{ text: '❌ Отмена', callback_data: KeyboardCancelCallBack.CANCEL_STEPS }],
        ],
      };

      this.messageService.sendKeyboard(chatId, message, keyboard);
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в handleCategoryNameInput для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleCategoryEmojiInput(chatId: number, emoji: string): void {
    try {
      const state: UserState | null = this.stateManager.getUserState(chatId);
      if (!state) {
        this.messageService.sendText(
          chatId,
          '❌ Состояние пользователя не найдено. Начните заново с /addcategory',
        );
        return;
      }
      this.messageService.sendText(chatId, JSON.stringify(state));
      const { name, type } = state.data;

      const typeNames: Record<string, string> = {
        [CategoryTypeCallBack.INCOME]: CategoryType.INCOME,
        [CategoryTypeCallBack.EXPENSE]: CategoryType.EXPENSE,
        [CategoryTypeCallBack.TRANSFER]: CategoryType.TRANSFER,
      };

      // Добавляем категорию в Google Sheets
      const result = this.googleSheetsService.addCategory(name, typeNames[type], emoji);

      if (result.success) {
        const message =
          `✅ Категория успешно добавлена!\n\n` +
          `📝 Название: ${name}\n` +
          `📂 Тип: ${typeNames[type]}\n` +
          `😊 Эмодзи: ${emoji}\n`;

        this.messageService.sendText(chatId, message);
      } else {
        this.messageService.sendText(
          chatId,
          `❌ Ошибка при добавлении категории: ${result.error || 'Неизвестная ошибка'}`,
        );
      }

      // Очищаем состояние пользователя
      this.stateManager.clearUserState(chatId);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка в handleCategoryEmojiInput: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.clearUserState(chatId);
    }
  }
}
