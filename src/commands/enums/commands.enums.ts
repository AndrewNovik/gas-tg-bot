import { COMMANDS_CALLBACK } from '@commands/consts/commands.consts';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum COMMANDS {
  START = '/start',
  HELP = '/help',
  MENU = '/menu',
  ADDTRANSACTION = '/addtransaction',
  ADDCATEGORY = '/addcategory',
}

export enum COMMANDS_CB {
  HELP = `${COMMANDS_CALLBACK}_help`,
  MENU = `${COMMANDS_CALLBACK}_menu`,
  STATS = `${COMMANDS_CALLBACK}_stats`,

  INCOME = `${COMMANDS_CALLBACK}_income`,
  EXPENSE = `${COMMANDS_CALLBACK}_expense`,
  TRANSFER = `${COMMANDS_CALLBACK}_transfer`,
  SETTINGS = `${COMMANDS_CALLBACK}_settings`,
}
