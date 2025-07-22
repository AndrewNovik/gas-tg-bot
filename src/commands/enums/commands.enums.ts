import {
  CHOOSE_CATEGORY,
  CALLBACK_PREFIX,
  ID_PREFIX,
  CHOOSE_TRANSACTION_TYPE,
} from '@commands/consts/commands.consts';

export enum CONFIRM_ACTION {
  EDIT = 'edit',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
}

export enum TRANSACTION_TYPE {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum SETUP_BOT_COMMANDS {
  START = 'start',
  ADDTRANSACTION = 'addtransaction',
  ADDCATEGORY = 'addcategory',
  ADDACCOUNT = 'addaccount',
  ADDINCOME = 'addincome',
  ADDEXPENSE = 'addexpense',
  ADDTRANSFER = 'addtransfer',
  CANCEL = 'cancel',
}

// Команды со слешем
export enum MAIN_COMMANDS {
  START = '/start',
  ADDTRANSACTION = '/addtransaction',
  ADDCATEGORY = '/addcategory',
  ADDACCOUNT = '/addaccount',
  ADDINCOME = '/addincome',
  ADDEXPENSE = '/addexpense',
  ADDTRANSFER = '/addtransfer',
  CANCEL = '/cancel',
}

// Команды без слеша
export enum TEXT_COMMANDS {
  INCOME = '💵 Доход',
  EXPENSE = '💸 Расход',
  TRANSFER = '💸 Перевод',
  ADDCATEGORY = '📝 Добавить категорию',
  ADDTRANSACTION = '📝 Добавить транзакцию',
  ADDACCOUNT = '📝 Добавить счет',
  CANCEL = '❌ Отмена',
  // Настройки to do позже
  SETTINGS = '⚙️ Настройки',
}

export enum TEXT_MESSAGES {
  RESET_USER_STATE = '🔄 Начнем сначала! Выбери действие:',
  CATEGORY_ADDED = '✅ Категория успешно добавлена',
  TRANSACTION_ADDED = '✅ Транзакция успешно добавлена',
  ACCOUNT_ADDED = '✅ Счет успешно добавлен',
  CATEGORY_NOT_ADDED = '❌ Ошибка при добавлении категории',
  ACCOUNT_NOT_ADDED = '❌ Ошибка при добавлении счета',
  CATEGORY_NOT_FOUND = '❌ Категория не найдена',
  CATEGORY_ALREADY_EXISTS = '❌ Категория уже существует',
  CATEGORY_DELETED = '✅ Категория успешно удалена',
  TRANSACTION_NOT_ADDED = '❌ Ошибка при добавлении транзакции',
  CANCEL_CATEGORY = '❌ Создание категории отменено',
  NEW_ACTION = '🔥 Отлично, что ещё добавим?',
}

export enum CALLBACK_COMMANDS {
  STATS = `${CHOOSE_TRANSACTION_TYPE}stats`,

  // Выбор категории транзакции
  INCOME = `${CHOOSE_TRANSACTION_TYPE}income`,
  EXPENSE = `${CHOOSE_TRANSACTION_TYPE}expense`,
  TRANSFER = `${CHOOSE_TRANSACTION_TYPE}transfer`,

  // Выбор типа транзакции
  CHOOSE_TRANSACTION_CATEGORY = `${CHOOSE_CATEGORY}${CALLBACK_PREFIX}${ID_PREFIX}`,
}
