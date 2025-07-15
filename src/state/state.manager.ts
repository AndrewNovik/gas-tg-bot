import { CONFIG } from '@config';
import { CategoryAddStepsCallBack, UserState } from '@state';

export class StateManager {
  private static instance: StateManager;
  private cache: GoogleAppsScript.Cache.Cache;

  private constructor() {
    this.cache = CacheService.getScriptCache();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public setUserState(
    chatId: number,
    step: CategoryAddStepsCallBack,
    data?: Record<string, any>,
  ): void {
    try {
      const state: UserState = {
        step: step,
        data: data || {},
        timestamp: new Date().getTime(),
      };

      const key = `user_state_${chatId}`;
      const stateJson = JSON.stringify(state);

      this.cache.put(key, stateJson, 300);
    } catch (error) {
      this.sendAdminMessage(
        `❌ Ошибка в setUserState для ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public getUserState(chatId: number): UserState | null {
    const key = `user_state_${chatId}`;

    const stateJson = this.cache.get(key);

    if (stateJson) {
      return JSON.parse(stateJson);
    }

    this.sendAdminMessage(`❌ Состояние для ${chatId} не найдено в кэше`);
    return null;
  }

  public isUserInSteps(chatId: number, step?: CategoryAddStepsCallBack): boolean {
    const state = this.getUserState(chatId);
    return Boolean(state && state.step === step);
  }

  public isUserInCache(chatId: number): boolean {
    const key = `user_state_${chatId}`;
    return this.cache.get(key) !== null;
  }

  public clearUserState(chatId: number): void {
    const key = `user_state_${chatId}`;
    this.cache.remove(key);
  }

  public updateUserStateData(chatId: number, newData: Record<string, any>): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Объединяем существующие данные с новыми
      state.data = { ...state.data, ...newData };
      state.timestamp = new Date().getTime();

      const key = `user_state_${chatId}`;
      this.cache.put(key, JSON.stringify(state), 300);
    } else {
      this.sendAdminMessage(`❌ Не удалось обновить состояние для ${chatId}: состояние не найдено`);
    }
  }

  public updateUserStep(chatId: number, newStep: CategoryAddStepsCallBack): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Обновляем только тип состояния, сохраняя все данные
      state.step = newStep;
      state.timestamp = new Date().getTime();

      const key = `user_state_${chatId}`;
      this.cache.put(key, JSON.stringify(state), 300);
    } else {
      this.sendAdminMessage(
        `❌ Не удалось обновить тип состояния для ${chatId}: состояние не найдено`,
      );
    }
  }

  private sendAdminMessage(message: string): void {
    try {
      const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
      const payload = {
        chat_id: CONFIG.ADMIN_ID,
        text: message,
        parse_mode: 'HTML',
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      };

      UrlFetchApp.fetch(url, options);
    } catch (error) {
      throw new Error(
        `❌ Ошибка в sendAdminMessage: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
