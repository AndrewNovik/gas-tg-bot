import { TEXT_COMMANDS } from '@commands/enums';
import { TelegramReplyKeyboard } from '@telegram-api/index';

export const USERS_ID = [396628436, 1009697451];

export const COMMANDS_CALLBACK = 'commands_callback';

export const startMenuKeyboard: TelegramReplyKeyboard = {
  keyboard: [
    [TEXT_COMMANDS.INCOME, TEXT_COMMANDS.EXPENSE],
    [TEXT_COMMANDS.TRANSFER, TEXT_COMMANDS.ADDCATEGORY],
    [TEXT_COMMANDS.SETTINGS],
  ],
  resize_keyboard: true, // автоматически подгоняет размер кнопок
  one_time_keyboard: true, // скрывать после нажатия
};

export const addTransactionKeyboard: TelegramReplyKeyboard = {
  keyboard: [[TEXT_COMMANDS.INCOME], [TEXT_COMMANDS.EXPENSE], [TEXT_COMMANDS.TRANSFER]],
  resize_keyboard: true, // автоматически подгоняет размер кнопок
  one_time_keyboard: true, // скрывать после нажатия
};
