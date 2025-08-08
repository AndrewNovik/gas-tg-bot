import {
  CALLBACK_COMMANDS,
  CONFIRM_ACTION,
  SETUP_BOT_COMMANDS,
  TEXT_COMMANDS,
} from '@commands/enums';
import { BotCommand } from '@commands/interfaces';
import { TelegramInlineKeyboardInterface, TelegramReplyKeyboardInterface } from '@telegram-api';

export const USERS_ID = [396628436, 1009697451];

// PREFIXES
export const ID_PREFIX = 'id_';
export const CALLBACK_PREFIX = 'callback_';
export const CHOOSE_CATEGORY = 'choose_category_';
export const CHOOSE_ACCOUNT = 'choose_account_';
export const CHOOSE_FROM_ACCOUNT = 'choose_from_account_';
export const CHOOSE_TO_ACCOUNT = 'choose_to_account_';
export const CHOOSE_TRANSACTION_TYPE = 'choose_transaction_type_';
export const CONFIRM_DESICION = 'confirm_desicion_';

// TRANSFER CATEGORIES
export const TRANSFER_DEBIT_CATEGORY = 'Трансфер списание';
export const TRANSFER_CREDIT_CATEGORY = 'Трансфер пополнение';

export const startMenuReplyKeyboard: TelegramReplyKeyboardInterface = {
  keyboard: [
    [TEXT_COMMANDS.INCOME, TEXT_COMMANDS.EXPENSE, TEXT_COMMANDS.TRANSFER],
    [TEXT_COMMANDS.ADDCATEGORY, TEXT_COMMANDS.ADDTRANSACTION, TEXT_COMMANDS.ADDACCOUNT],
    [TEXT_COMMANDS.ACCOUNT_BALANCES, TEXT_COMMANDS.TRANSACTION_CATEGORIES],
    [TEXT_COMMANDS.STATS_PER_DAY, TEXT_COMMANDS.STATS_PER_WEEK],
    [TEXT_COMMANDS.STATS_PER_TWO_WEEKS, TEXT_COMMANDS.STATS_PER_MONTH],
    [TEXT_COMMANDS.SETTINGS],
  ],
  resize_keyboard: true, // автоматически подгоняет размер кнопок
  one_time_keyboard: true, // скрывать после нажатия
};

export const addTransactionReplyKeyboard: TelegramReplyKeyboardInterface = {
  keyboard: [[TEXT_COMMANDS.INCOME], [TEXT_COMMANDS.EXPENSE], [TEXT_COMMANDS.TRANSFER]],
  resize_keyboard: true, // автоматически подгоняет размер кнопок
  one_time_keyboard: true, // скрывать после нажатия
};

export const confirmInlineKeyboard: TelegramInlineKeyboardInterface = {
  inline_keyboard: [
    [
      {
        text: `✍️ ${CONFIRM_ACTION.EDIT}`,
        callback_data: `${CALLBACK_COMMANDS.EDIT}`,
      },
      {
        text: `❌ ${CONFIRM_ACTION.CANCEL}`,
        callback_data: `${CALLBACK_COMMANDS.CANCEL}`,
      },
      {
        text: `💬 ${CONFIRM_ACTION.ADD_COMMENT}`,
        callback_data: `${CALLBACK_COMMANDS.ADD_COMMENT}`,
      },
    ],
    [
      {
        text: `✅ ${CONFIRM_ACTION.CONFIRM}`,
        callback_data: `${CALLBACK_COMMANDS.CONFIRM}`,
      },
    ],
  ],
};

export const setupBotCommands: BotCommand[] = [
  {
    command: SETUP_BOT_COMMANDS.START,
    description: '👋 Начало работы с ботом',
  },
  {
    command: SETUP_BOT_COMMANDS.ACCOUNT_BALANCES,
    description: '💳 Балансы счетов',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDTRANSACTION,
    description: '📝 Добавить новую транзакцию',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDCATEGORY,
    description: '📝 Добавить новую категорию',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDINCOME,
    description: '💵 Добавить доход',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDEXPENSE,
    description: '💸 Добавить расход',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDTRANSFER,
    description: '💸 Добавить трансфер',
  },
  {
    command: SETUP_BOT_COMMANDS.STATS_PER_DAY,
    description: '📊 Статистика за день',
  },
  {
    command: SETUP_BOT_COMMANDS.STATS_PER_WEEK,
    description: '📊 Статистика за неделю',
  },
  {
    command: SETUP_BOT_COMMANDS.STATS_PER_TWO_WEEKS,
    description: '📊 Статистика за 2 недели',
  },
  {
    command: SETUP_BOT_COMMANDS.STATS_PER_MONTH,
    description: '📊 Статистика за текущий месяц',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDACCOUNT,
    description: '📝 Добавить новый счет',
  },
  {
    command: SETUP_BOT_COMMANDS.TRANSACTION_CATEGORIES,
    description: '📝 Список категорий',
  },
  {
    command: SETUP_BOT_COMMANDS.CANCEL,
    description: '❌ Отменить текущие действия',
  },
];

export const addCategoryTypeInlienKeyboard: TelegramInlineKeyboardInterface = {
  inline_keyboard: [
    [
      {
        text: `💵 Доход`,
        callback_data: `${CALLBACK_COMMANDS.INCOME}`,
      },
      {
        text: `💸 Расход`,
        callback_data: `${CALLBACK_COMMANDS.EXPENSE}`,
      },
      {
        text: `💸 Трансфер`,
        callback_data: `${CALLBACK_COMMANDS.TRANSFER}`,
      },
    ],
  ],
};
