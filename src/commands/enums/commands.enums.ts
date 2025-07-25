import {
  CHOOSE_CATEGORY,
  CALLBACK_PREFIX,
  ID_PREFIX,
  CHOOSE_TRANSACTION_TYPE,
  CONFIRM_DESICION,
} from '@commands/consts/commands.consts';

export enum CONFIRM_ACTION {
  EDIT = 'edit',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  ADD_COMMENT = 'comment',
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
  INCOME = '💵 Income',
  EXPENSE = '💸 Expense',
  TRANSFER = '💸 Transfer',
  ADDCATEGORY = '📝 Add category',
  ADDTRANSACTION = '📝 Add transaction',
  ADDACCOUNT = '📝 Add account',
  CANCEL = '❌ Cancel',
  // Настройки to do позже
  SETTINGS = '⚙️ Settings',
}

export enum TEXT_MESSAGES {
  // MAIN
  RESET_USER_STATE = "🔄 Let's start over! Choose an action:",
  NEW_ACTION = '🔥 Great, what else do you want to add?',
  UNKNOWN_CALLBACK = '❌ Unknown callback',
  UNKNOWN_COMMAND = '❌ Unknown command',
  CRITICAL_ERROR = '❌ Critical error',
  COMMENT_ADDED = '✅ comment added',
  // CATEGORIES
  // CATEGORY SUCCESS
  CATEGORY_ADDED = '✅ category added',
  CATEGORY_DELETED = '✅ category deleted',
  CANCEL_CATEGORY = '✅ cancel category',
  EDIT_CATEGORY = '✏️ edit category',
  // CATEGORY ERRORS
  CATEGORY_NOT_ADDED = '❌ error adding category',
  CATEGORY_NOT_FOUND = '❌ category not found',
  CATEGORY_ALREADY_EXISTS = '❌ category already exists',
  // TRANSACTIONS
  // TRANSACTION SUCCESS
  TRANSACTION_ADDED = '✅ transaction added',
  TRANSACTION_DELETED = '✅ transaction deleted',
  CANCEL_TRANSACTION = '✅ cancel transaction',
  EDIT_TRANSACTION = '✏️ edit transaction',
  // TRANSACTION ERRORS
  TRANSACTION_NOT_ADDED = '❌ error adding transaction',
  TRANSACTION_NOT_FOUND = '❌ transaction not found',
  TRANSACTION_ALREADY_EXISTS = '❌ transaction already exists',
  // ACCOUNTS
  // ACCOUNT SUCCESS
  ACCOUNT_ADDED = '✅ account added',
  ACCOUNT_DELETED = '✅ account deleted',
  CANCEL_ACCOUNT = '✅ cancel account',
  EDIT_ACCOUNT = '✏️ edit account',
  // ACCOUNT ERRORS
  ACCOUNT_NOT_ADDED = '❌ error adding account',
  ACCOUNT_NOT_FOUND = '❌ account not found',
  ACCOUNT_ALREADY_EXISTS = '❌ account already exists',
}

export enum CALLBACK_COMMANDS {
  // Выбор категории транзакции
  INCOME = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.INCOME}`,
  EXPENSE = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.EXPENSE}`,
  TRANSFER = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.TRANSFER}`,

  // Выбор категории для транзакции через id
  CHOOSE_TRANSACTION_CATEGORY = `${CHOOSE_CATEGORY}${CALLBACK_PREFIX}${ID_PREFIX}`,

  // Колбеки для подтверждения или отмены действий
  CONFIRM = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CONFIRM}`,
  CANCEL = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CANCEL}`,
  EDIT = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.EDIT}`,
  ADD_COMMENT = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.ADD_COMMENT}`,
}
