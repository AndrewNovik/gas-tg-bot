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

// Команды со слешем
export enum MAIN_COMMANDS {
  START = '/start',
  ADDTRANSACTION = '/addtransaction',
  ADDCATEGORY = '/addcategory',
  ADDINCOME = '/addincome',
  ADDEXPENSE = '/addexpense',
  ADDTRANSFER = '/addtransfer',
  CANCEL = '/cancel',
}

// Команды без слеша
export enum TEXT_COMMANDS {
  INCOME = 'Доход',
  EXPENSE = 'Расход',
  TRANSFER = 'Перевод',
  ADDCATEGORY = 'Добавить категорию',
  ADDTRANSACTION = 'Добавить транзакцию',
  CANCEL = 'Отмена',
  // Настройки to do позже
  SETTINGS = 'Настройки',
}

export enum CALLBACK_COMMANDS {
  STATS = `${CHOOSE_TRANSACTION_TYPE}stats`,

  // Выбор категории транзакции
  INCOME = `${CHOOSE_TRANSACTION_TYPE}income`,
  EXPENSE = `${CHOOSE_TRANSACTION_TYPE}expense`,
  TRANSFER = `${CHOOSE_TRANSACTION_TYPE}transfer`,
  SETTINGS = `${CHOOSE_TRANSACTION_TYPE}settings`,

  // Выбор типа транзакции
  CHOOSE_TRANSACTION_CATEGORY = `${CHOOSE_CATEGORY}${CALLBACK_PREFIX}${ID_PREFIX}`,
}
