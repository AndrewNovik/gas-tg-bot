import {
  CHOOSE_CATEGORY,
  CHOOSE_ACCOUNT,
  CHOOSE_FROM_ACCOUNT,
  CHOOSE_TO_ACCOUNT,
  CALLBACK_PREFIX,
  ID_PREFIX,
  CHOOSE_TRANSACTION_TYPE,
  CONFIRM_DESICION,
} from '@commands/consts/commands.consts';

export enum CONFIRM_ACTION {
  EDIT = 'редактировать',
  CONFIRM = 'подтвердить',
  CANCEL = 'отмена',
  ADD_COMMENT = 'комментарий',
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
  STATS_PER_DAY = 'statsperday',
  STATS_PER_WEEK = 'statsperweek',
  STATS_PER_TWO_WEEKS = 'statspetwoweeks',
  STATS_PER_MONTH = 'statspermonth',
  ACCOUNT_BALANCES = 'accountbalances',
  TRANSACTION_CATEGORIES = 'transactioncategories',
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
  STATS_PER_DAY = '/statsperday',
  STATS_PER_WEEK = '/statsperweek',
  STATS_PER_TWO_WEEKS = '/statspetwoweeks',
  STATS_PER_MONTH = '/statspermonth',
  ACCOUNT_BALANCES = '/accountbalances',
  TRANSACTION_CATEGORIES = '/transactioncategories',
  CANCEL = '/cancel',
}

// Команды без слеша
export enum TEXT_COMMANDS {
  INCOME = '💵 Доход',
  EXPENSE = '💸 Расход',
  TRANSFER = '💸 Трансфер',
  ADDCATEGORY = '📝 Добавить категорию',
  ADDTRANSACTION = '📝 Добавить транзакцию',
  ADDACCOUNT = '📝 Добавить счет',
  ACCOUNT_BALANCES = '💳 Балансы счетов',
  TRANSACTION_CATEGORIES = '📝 Список категорий',
  CANCEL = '❌ Отмена',
  STATS_PER_DAY = '📊 Статистика за день',
  STATS_PER_WEEK = '📊 Статистика за неделю',
  STATS_PER_TWO_WEEKS = '📊 Статистика за 2 недели',
  STATS_PER_MONTH = '📊 Статистика за текущий месяц',
  // Настройки to do позже
  SETTINGS = '⚙️ Настройки',
}

export enum TEXT_MESSAGES {
  // MAIN
  RESET_USER_STATE = '🔄 Давайте начнем сначала! Выберите действие:',
  NEW_ACTION = '🔥 Отлично, что еще вы хотите добавить?',
  UNKNOWN_CALLBACK = '❌ Неизвестный callback',
  UNKNOWN_COMMAND = '❌ Неизвестная команда',
  CRITICAL_ERROR = '❌ Критическая ошибка',
  COMMENT_ADDED = '✅ комментарий добавлен',
  CHOOSE_ACCOUNT_FOR_TRANSACTION = '💳 Выберите счет для транзакции',
  // CATEGORIES
  // CATEGORY SUCCESS
  CATEGORY_ADDED = '✅ категория добавлена',
  CATEGORY_DELETED = '✅ категория удалена',
  CANCEL_CATEGORY = '✅ отмена категории',
  EDIT_CATEGORY = '✏️ редактировать категорию',
  // CATEGORY ERRORS
  CATEGORY_NOT_ADDED = '❌ ошибка добавления категории',
  CATEGORY_NOT_FOUND = '❌ категория не найдена',
  CATEGORY_ALREADY_EXISTS = '❌ категория уже существует',
  // TRANSACTIONS
  // TRANSACTION SUCCESS
  TRANSACTION_ADDED = '✅ транзакция добавлена',
  TRANSACTION_DELETED = '✅ транзакция удалена',
  CANCEL_TRANSACTION = '✅ отмена транзакции',
  EDIT_TRANSACTION = '✏️ редактировать транзакцию',
  // TRANSACTION ERRORS
  TRANSACTION_NOT_ADDED = '❌ ошибка добавления транзакции',
  TRANSACTION_NOT_FOUND = '❌ транзакция не найдена',
  TRANSACTION_ALREADY_EXISTS = '❌ транзакция уже существует',
  // ACCOUNTS
  // ACCOUNT SUCCESS
  ACCOUNT_ADDED = '✅ счет добавлен',
  ACCOUNT_DELETED = '✅ счет удален',
  CANCEL_ACCOUNT = '✅ отмена счета',
  EDIT_ACCOUNT = '✏️ редактировать счет',
  // ACCOUNT ERRORS
  ACCOUNT_NOT_ADDED = '❌ ошибка добавления счета',
  ACCOUNT_NOT_FOUND = '❌ счет не найден',
  ACCOUNT_ALREADY_EXISTS = '❌ счет уже существует',
  // TRANSFER
  CHOOSE_FROM_ACCOUNT_FOR_TRANSFER = '💳 Выберите счет списания',
  CHOOSE_TO_ACCOUNT_FOR_TRANSFER = '💳 Выберите счет пополнения',
  ENTER_TRANSFER_AMOUNT = '💰 Введите сумму трансфера',
  TRANSFER_ADDED = '✅ трансфер выполнен',
  TRANSFER_NOT_ADDED = '❌ ошибка при создании трансфера',
  CANCEL_TRANSFER = '✅ трансфер отменен',
  EDIT_TRANSFER = '✏️ редактировать трансфер',
}

export enum CALLBACK_COMMANDS {
  // Выбор категории транзакции
  INCOME = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.INCOME}`,
  EXPENSE = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.EXPENSE}`,
  TRANSFER = `${CHOOSE_TRANSACTION_TYPE}${TRANSACTION_TYPE.TRANSFER}`,

  // Выбор категории для транзакции через id
  CHOOSE_TRANSACTION_CATEGORY = `${CHOOSE_CATEGORY}${CALLBACK_PREFIX}${ID_PREFIX}`,
  CHOOSE_TRANSACTION_ACCOUNT = `${CHOOSE_ACCOUNT}${CALLBACK_PREFIX}${ID_PREFIX}`,

  // Выбор счетов для трансфера
  CHOOSE_TRANSFER_FROM_ACCOUNT = `${CHOOSE_FROM_ACCOUNT}${CALLBACK_PREFIX}${ID_PREFIX}`,
  CHOOSE_TRANSFER_TO_ACCOUNT = `${CHOOSE_TO_ACCOUNT}${CALLBACK_PREFIX}${ID_PREFIX}`,

  // Колбеки для подтверждения или отмены действий
  CONFIRM = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CONFIRM}`,
  CANCEL = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.CANCEL}`,
  EDIT = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.EDIT}`,
  ADD_COMMENT = `${CONFIRM_DESICION}${CALLBACK_PREFIX}${CONFIRM_ACTION.ADD_COMMENT}`,
}

export enum STATS_PER_PERIOD {
  DAY = 'day',
  WEEK = 'week',
  TWO_WEEKS = 'two_weeks',
  MONTH = 'month',
}
