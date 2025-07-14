import { CONFIG } from '../config';
import { StateType, CategoryType } from '../types';
import { StateManager } from '../services/StateManager';
import { MessageService } from '../services/MessageService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';

export class TextCommandsController {
  private static instance: TextCommandsController;
  private stateManager: StateManager;
  private messageService: MessageService;
  private googleSheetsService: GoogleSheetsService;

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

  public handleTextCommand(message: any): void {
    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from.first_name;

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

      case '/add':
        this.handleAddTransaction(chatId, firstName);
        break;

      case '/addcategory':
        this.handleAddCategoryStart(chatId, firstName);
        break;

      case '/testcache':
        this.testCache();
        break;

      default:
        // Проверяем, находится ли пользователь в процессе добавления категории
        const currentState = this.stateManager.getUserState(chatId);
        this.messageService.sendText(
          Number(CONFIG.ADMIN_ID),
          `🔍 Проверка состояния для ${chatId}: ${currentState ? JSON.stringify(currentState) : 'null'}`,
        );

        if (this.stateManager.isUserInState(chatId, StateType.ADDING_CATEGORY_NAME)) {
          this.messageService.sendText(
            Number(CONFIG.ADMIN_ID),
            `✅ Обрабатываем ввод названия категории: "${text}"`,
          );
          this.handleCategoryNameInput(chatId, text);
        } else if (this.stateManager.isUserInState(chatId, StateType.ADDING_CATEGORY_EMOJI)) {
          this.messageService.sendText(
            Number(CONFIG.ADMIN_ID),
            `✅ Обрабатываем ввод эмодзи: "${text}"`,
          );
          this.handleCategoryEmojiInput(chatId, text);
        } else {
          this.messageService.sendText(
            Number(CONFIG.ADMIN_ID),
            `❌ Пользователь ${chatId} не в состоянии добавления категории. Текст: "${text}"`,
          );
          // Эхо-ответ
          this.messageService.sendText(chatId, `Вы написали: "${text}"`);
        }
    }
  }

  private handleAddTransaction(chatId: number, firstName: string): void {
    // Генерируем тестовые данные
    const testDescriptions = [
      'Покупка продуктов',
      'Оплата интернета',
      'Заправка автомобиля',
      'Покупка книги',
      'Обед в кафе',
      'Транспорт',
      'Покупка одежды',
    ];

    const testCategories = [
      'Продукты',
      'Интернет',
      'Транспорт',
      'Образование',
      'Питание',
      'Транспорт',
      'Одежда',
    ];

    // Выбираем случайные данные
    // const randomIndex = Math.floor(Math.random() * testDescriptions.length);
    const description = testDescriptions[0];
    const category = testCategories[0];
    const amount = Math.floor(Math.random() * 5000) + 100; // от 100 до 5100

    try {
      // Добавляем транзакцию в Google Sheets
      const result = this.googleSheetsService.addTransaction('sdsds', amount, category);

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
      console.error(
        '❌ Ошибка в handleAddTransaction:',
        error instanceof Error ? error.message : String(error),
      );
      this.messageService.sendText(
        chatId,
        `❌ Произошла ошибка при добавлении транзакции: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleAddCategoryStart(chatId: number, firstName: string): void {
    try {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `🚀 Начало добавления категории для ${chatId}`,
      );

      // Получаем следующий ID для категории
      const nextId = this.googleSheetsService.getNextCategoryId();
      this.messageService.sendText(Number(CONFIG.ADMIN_ID), `🆔 Получен ID категории: ${nextId}`);

      // Устанавливаем состояние пользователя
      this.stateManager.setUserState(chatId, StateType.ADDING_CATEGORY_NAME, {
        categoryId: nextId,
      });

      const message =
        `📂 Добавление новой категории\n\n` +
        `🆔 ID категории: ${nextId}\n\n` +
        `📝 Введите название категории:`;

      this.messageService.sendText(chatId, message);
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `✅ Сообщение отправлено пользователю ${chatId}`,
      );
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в handleAddCategoryStart для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.messageService.sendText(
        chatId,
        `❌ Произошла ошибка при начале добавления категории: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleCategoryNameInput(chatId: number, name: string): void {
    try {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `📝 Обработка названия категории для ${chatId}: "${name}"`,
      );

      // Обновляем состояние с названием
      this.stateManager.updateUserStateData(chatId, { name: name });

      // Переходим к выбору типа (обновляем только тип, сохраняя данные)
      this.stateManager.updateUserStateType(chatId, StateType.ADDING_CATEGORY_TYPE);

      const message = `✅ Название: "${name}"\n\n` + `📂 Теперь выберите тип категории:`;

      this.messageService.sendText(chatId, message);
      this.messageService.sendCategoryTypeKeyboard(chatId);
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `✅ Клавиатура с типами отправлена пользователю ${chatId}`,
      );
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в handleCategoryNameInput для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.messageService.sendText(
        chatId,
        `❌ Произошла ошибка при обработке названия: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleCategoryEmojiInput(chatId: number, emoji: string): void {
    try {
      const state = this.stateManager.getUserState(chatId);
      if (!state) {
        this.messageService.sendText(
          chatId,
          '❌ Состояние пользователя не найдено. Начните заново с /addcategory',
        );
        return;
      }

      const { categoryId, name, type } = state.data;

      // Добавляем категорию в Google Sheets
      const result = this.googleSheetsService.addCategory(categoryId, name, type, emoji);

      if (result.success) {
        const typeNames: Record<string, string> = {
          [CategoryType.INCOME]: 'Доход',
          [CategoryType.EXPENSE]: 'Расход',
          [CategoryType.TRANSFER]: 'Перевод',
        };

        const message =
          `✅ Категория успешно добавлена!\n\n` +
          `🆔 ID: ${categoryId}\n` +
          `📝 Название: ${name}\n` +
          `📂 Тип: ${typeNames[type as string] || type}\n` +
          `😊 Эмодзи: ${emoji}\n` +
          `📊 Строка: ${result.row || 'Не указана'}`;

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
      console.error(
        '❌ Ошибка в handleCategoryEmojiInput:',
        error instanceof Error ? error.message : String(error),
      );
      this.messageService.sendText(
        chatId,
        `❌ Произошла ошибка при добавлении категории: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.stateManager.clearUserState(chatId);
    }
  }

  private testCache(): void {
    try {
      this.messageService.sendText(Number(CONFIG.ADMIN_ID), '🧪 Начинаем тест кэша');

      const cache = CacheService.getScriptCache();
      const testKey = 'test_key';
      const testValue = 'test_value';

      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `🧪 Сохраняем тестовые данные: ${testKey} = ${testValue}`,
      );
      cache.put(testKey, testValue, 3600);

      const retrievedValue = cache.get(testKey);
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `🧪 Полученные данные: ${retrievedValue}`,
      );

      if (retrievedValue === testValue) {
        this.messageService.sendText(Number(CONFIG.ADMIN_ID), '✅ Тест кэша прошел успешно!');
      } else {
        this.messageService.sendText(Number(CONFIG.ADMIN_ID), '❌ Тест кэша провалился!');
      }

      // Очищаем тестовые данные
      cache.remove(testKey);
    } catch (error) {
      this.messageService.sendText(
        Number(CONFIG.ADMIN_ID),
        `❌ Ошибка в тесте кэша: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
