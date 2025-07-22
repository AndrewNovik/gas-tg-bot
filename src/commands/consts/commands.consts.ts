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
export const CHOOSE_TRANSACTION_TYPE = 'choose_transaction_type_';
export const CONFIRM_DESICION = 'confirm_desicion_';

export const startMenuReplyKeyboard: TelegramReplyKeyboardInterface = {
  keyboard: [
    [TEXT_COMMANDS.INCOME, TEXT_COMMANDS.EXPENSE],
    [TEXT_COMMANDS.TRANSFER],
    [TEXT_COMMANDS.ADDCATEGORY, TEXT_COMMANDS.ADDTRANSACTION, TEXT_COMMANDS.ADDACCOUNT],
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
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.EDIT}`,
      },
      {
        text: `❌ ${CONFIRM_ACTION.CANCEL}`,
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CANCEL}`,
      },
    ],
    [
      {
        text: `✅ ${CONFIRM_ACTION.CONFIRM}`,
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CONFIRM}`,
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
    command: SETUP_BOT_COMMANDS.ADDTRANSACTION,
    description: '📝 Добавить новую транзакцию в таблицу',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDCATEGORY,
    description: '📝 Добавить новую категорию транзакций',
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
    description: '💸 Добавить перевод',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDACCOUNT,
    description: '📝 Добавить новый счет',
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
        text: `💸 Перевод`,
        callback_data: `${CALLBACK_COMMANDS.TRANSFER}`,
      },
    ],
  ],
};
