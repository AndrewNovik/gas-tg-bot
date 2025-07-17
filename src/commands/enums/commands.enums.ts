import { COMMANDS_CALLBACK } from '@commands/consts/commands.consts';

export enum TRANSACTION_TYPE {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

// Команды со слешем
export enum MAIN_COMMANDS {
  START = '/start', // готово
  ADDTRANSACTION = '/addtransaction', // готово
  ADDCATEGORY = '/addcategory', // готово
  // Добавление транзакции to do позже
  ADDINCOME = '/addincome',
  ADDEXPENSE = '/addexpense',
  ADDTRANSFER = '/addtransfer',
}

// Команды без слеша
export enum TEXT_COMMANDS {
  INCOME = 'Доход',
  EXPENSE = 'Расход',
  TRANSFER = 'Перевод',
  ADDCATEGORY = 'Добавить категорию', // готово
  // Настройки to do позже
  SETTINGS = 'Настройки',
}

export enum CALLBACK_COMMANDS {
  STATS = `${COMMANDS_CALLBACK}_stats`,

  INCOME = `${COMMANDS_CALLBACK}_income`,
  EXPENSE = `${COMMANDS_CALLBACK}_expense`,
  TRANSFER = `${COMMANDS_CALLBACK}_transfer`,
  SETTINGS = `${COMMANDS_CALLBACK}_settings`,
}
