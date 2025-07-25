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
    [TEXT_COMMANDS.INCOME, TEXT_COMMANDS.EXPENSE, TEXT_COMMANDS.TRANSFER],
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
    description: '👋 Start working with bot',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDTRANSACTION,
    description: '📝 Add new transaction',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDCATEGORY,
    description: '📝 Add new category',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDINCOME,
    description: '💵 Add income',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDEXPENSE,
    description: '💸 Add expense',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDTRANSFER,
    description: '💸 Add transfer',
  },
  {
    command: SETUP_BOT_COMMANDS.ADDACCOUNT,
    description: '📝 Add new account',
  },
  {
    command: SETUP_BOT_COMMANDS.CANCEL,
    description: '❌ Cancel current actions',
  },
];

export const addCategoryTypeInlienKeyboard: TelegramInlineKeyboardInterface = {
  inline_keyboard: [
    [
      {
        text: `💵 Income`,
        callback_data: `${CALLBACK_COMMANDS.INCOME}`,
      },
      {
        text: `💸 Expense`,
        callback_data: `${CALLBACK_COMMANDS.EXPENSE}`,
      },
      {
        text: `💸 Transfer`,
        callback_data: `${CALLBACK_COMMANDS.TRANSFER}`,
      },
    ],
  ],
};
