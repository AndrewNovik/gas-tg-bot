import { CONFIG } from '@config';
import {
  StateManager,
  CategoryAddStepsCallBack,
  CategoryTypeCallBack,
  KeyboardCancelCallBack,
  UserState,
  Keyboard,
} from '@state';
import { MessageService } from '@messages';
import { GoogleSheetsService } from '@google-sheets';
import { Message, TelegramReplyKeyboard } from '@telegram-api';
import { AbstractClassService } from '@shared';
import { CategoryType, USERS_ID } from '@commands';
import { COMMANDS, COMMANDS_CB } from '@commands/enums/commands.enums';
import { TransactionCategory } from '@google-sheets/interfaces';

export class TextCommandsController implements AbstractClassService<TextCommandsController> {
  private static instance: TextCommandsController;
  private readonly stateManager: StateManager;
  private readonly messageService: MessageService;
  public readonly googleSheetsService: GoogleSheetsService;

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
      case COMMANDS.START:
        const menuKeyboard: TelegramReplyKeyboard = {
          keyboard: [['💰 Доход', '💸 Новый расход'], ['⚙️ Настройки']],
          resize_keyboard: true, // автоматически подгоняет размер кнопок
          one_time_keyboard: false, // не скрывать после нажатия
        };
        this.messageService.sendReplyMarkup(
          chatId,
          `Привет, ${firstName}! Я простой бот на GAS.`,
          menuKeyboard,
        );
        break;

      case COMMANDS.HELP:
        this.messageService.sendText(
          chatId,
          'Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню\n/add - добавить транзакцию\n/addcategory - добавить категорию',
        );
        break;

      case COMMANDS.MENU:
        this.messageService.sendMenu(chatId);
        break;

      case COMMANDS.ADDTRANSACTION:
        const transactionTypeKeyboard: Keyboard = {
          inline_keyboard: [
            [
              { text: '💰 Доход', callback_data: COMMANDS_CB.INCOME },
              { text: '💸 Расход', callback_data: COMMANDS_CB.EXPENSE },
              { text: '🔄 Перевод', callback_data: COMMANDS_CB.TRANSFER },
            ],
          ],
        };
        this.messageService.sendKeyboard(
          chatId,
          'Выберите тип транзакции:',
          transactionTypeKeyboard,
        );
        break;

      case COMMANDS.ADDCATEGORY:
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
          // Обработка текстовых команд от Reply Keyboard
          switch (text) {
            case '💰 Доход':
              this.handleAddTransaction(chatId, firstName, CategoryType.INCOME);
              break;
            case '💸 Новый расход':
              this.handleAddTransaction(chatId, firstName, CategoryType.EXPENSE);
              break;
            case '⚙️ Настройки':
              this.messageService.sendText(chatId, '⚙️ Настройки пока недоступны');
              break;
            default:
              // Эхо-ответ
              this.messageService.sendText(chatId, `Эхо: "${text}"`);
          }
        }
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

  private handleAddTransaction(chatId: number, firstName: string, type: CategoryType): void {
    try {
      // Получаем категории по типу
      const categories: TransactionCategory[] = this.googleSheetsService.getCategoriesByType(type);

      if (categories.length === 0) {
        this.messageService.sendText(
          chatId,
          `❌ Категории для типа "${type}" не найдены. Сначала добавьте категории через /addcategory`,
        );
        return;
      }

      // Создаем клавиатуру с категориями
      const keyboard: TelegramReplyKeyboard = {
        keyboard: this.createCategoryKeyboard(categories),
        resize_keyboard: true,
        one_time_keyboard: false,
      };

      this.messageService.sendReplyMarkup(chatId, `Выбери категорию`, keyboard);
    } catch (error) {
      this.messageService.sendText(
        chatId,
        `❌ Ошибка при получении категорий: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private createCategoryKeyboard(categories: TransactionCategory[]): string[][] {
    const keyboard: string[][] = [];
    const itemsPerRow = 2; // 2 кнопки в ряду

    for (let i = 0; i < categories.length; i += itemsPerRow) {
      const row: string[] = [];

      for (let j = 0; j < itemsPerRow && i + j < categories.length; j++) {
        const category = categories[i + j];
        row.push(`${category.emoji} ${category.name}`);
      }

      keyboard.push(row);
    }

    return keyboard;
  }
}
