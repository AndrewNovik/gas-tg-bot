import { CONFIG } from '@config';
import { UserState, StateType } from '@state/interfaces';

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

  public setUserState(chatId: number, stateType: StateType, data: Record<string, any> = {}): void {
    try {
      const state: UserState = {
        type: stateType,
        data: data,
        timestamp: new Date().getTime(),
      };

      const key = `user_state_${chatId}`;
      const stateJson = JSON.stringify(state);

      // Проверяем, что кэш доступен
      const testKey = `test_${Date.now()}`;
      this.cache.put(testKey, 'test', 60);
      this.cache.remove(testKey);

      this.cache.put(key, stateJson, 3600);

      // Проверяем, что данные сохранились
      const savedData = this.cache.get(key);
      this.sendAdminMessage(`🔧 Проверка сохранения: ${savedData ? 'OK' : 'FAILED'}`);

      this.sendAdminMessage(`✅ Состояние установлено для ${chatId}: ${stateJson}`);
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

  public isUserInState(chatId: number, stateType: StateType): boolean {
    const state = this.getUserState(chatId);
    return Boolean(state && state.type === stateType);
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
      this.cache.put(key, JSON.stringify(state), 3600);
    } else {
      this.sendAdminMessage(`❌ Не удалось обновить состояние для ${chatId}: состояние не найдено`);
    }
  }

  public updateUserStateType(chatId: number, newType: StateType): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Обновляем только тип состояния, сохраняя все данные
      state.type = newType;
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
