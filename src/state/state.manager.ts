import { MessageService } from '@messages/services/message.service';
import { CategoryAddStepsCallBack, USER_STATE_KEY, UserState } from '@state';
import { TransactionAddStepsCallBack } from './enums/state.enums';

export class StateManager {
  private static instance: StateManager;
  private cache: GoogleAppsScript.Cache.Cache;
  private messageService: MessageService;

  private constructor() {
    this.cache = CacheService.getScriptCache();
    this.messageService = MessageService.getInstance();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public setUserState(
    chatId: number,
    step: CategoryAddStepsCallBack | TransactionAddStepsCallBack | null = null,
    data?: Record<string, any>,
  ): void {
    try {
      const state: UserState = {
        step: step,
        data: data || {},
      };

      const key = `${USER_STATE_KEY}${chatId}`;
      const stateJson = JSON.stringify(state);

      this.cache.put(key, stateJson, 300);
    } catch (error) {
      this.messageService.sendAdminMessage(
        `❌ Ошибка в setUserState для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public getUserState(chatId: number): UserState | null {
    const key = `${USER_STATE_KEY}${chatId}`;

    const stateJson = this.cache.get(key);

    if (stateJson) {
      return JSON.parse(stateJson);
    } else {
      this.messageService.sendAdminMessage(`❌ Состояние для ${chatId} не найдено в кэше`);
      return null;
    }
  }

  public isUserInSteps(chatId: number, step?: CategoryAddStepsCallBack): boolean {
    const state = this.getUserState(chatId);
    return Boolean(state && state.step === step);
  }

  public clearUserState(chatId: number): void {
    const key = `${USER_STATE_KEY}${chatId}`;
    this.cache.remove(key);
  }

  public updateUserStateData(chatId: number, newData: Record<string, any>): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Объединяем существующие данные с новыми
      state.data = { ...state.data, ...newData };

      const key = `${USER_STATE_KEY}${chatId}`;
      this.cache.put(key, JSON.stringify(state), 300);
    } else {
      this.messageService.sendAdminMessage(
        `❌ Не удалось обновить состояние для ${chatId}: состояние не найдено`,
      );
    }
  }

  public updateUserStep(chatId: number, newStep: CategoryAddStepsCallBack): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Обновляем только тип состояния, сохраняя все данные
      state.step = newStep;

      const key = `${USER_STATE_KEY}${chatId}`;
      this.cache.put(key, JSON.stringify(state), 300);
    } else {
      this.messageService.sendAdminMessage(
        `❌ Не удалось обновить тип состояния для ${chatId}: состояние не найдено`,
      );
    }
  }
}
