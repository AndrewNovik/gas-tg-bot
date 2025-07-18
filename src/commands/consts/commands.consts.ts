import { CONFIRM_ACTION, MAIN_COMMANDS, TEXT_COMMANDS } from '@commands/enums';
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
    [TEXT_COMMANDS.ADDCATEGORY, TEXT_COMMANDS.ADDTRANSACTION],
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
        text: `${CONFIRM_ACTION.EDIT}`,
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.EDIT}`,
      },
      {
        text: `${CONFIRM_ACTION.CANCEL}`,
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CANCEL}`,
      },
    ],
    [
      {
        text: `${CONFIRM_ACTION.CONFIRM}`,
        callback_data: `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CONFIRM}`,
      },
    ],
  ],
};

export const setupBotCommands: BotCommand[] = [
  {
    command: MAIN_COMMANDS.START,
    description: 'Начало работы с ботом',
  },
  {
    command: MAIN_COMMANDS.ADDTRANSACTION,
    description: 'Добавить новую транзакцию в таблицу',
  },
  {
    command: MAIN_COMMANDS.ADDCATEGORY,
    description: 'Добавить новую категорию транзакций',
  },
  {
    command: MAIN_COMMANDS.ADDINCOME,
    description: 'Добавить доход',
  },
  {
    command: MAIN_COMMANDS.ADDEXPENSE,
    description: 'Добавить расход',
  },
  {
    command: MAIN_COMMANDS.ADDTRANSFER,
    description: 'Добавить перевод',
  },
  {
    command: MAIN_COMMANDS.CANCEL,
    description: 'Отменить текущие действия',
  },
];
