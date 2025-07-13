import { UserState, StateType } from '../types';
import { CONFIG } from '../config';

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
      this.sendAdminMessage(`🔧 Попытка установить состояние для ${chatId}`);

      const state: UserState = {
        type: stateType,
        data: data,
        timestamp: new Date().getTime()
      };

      const key = `user_state_${chatId}`;
      const stateJson = JSON.stringify(state);

      this.sendAdminMessage(`🔧 Ключ кэша: ${key}`);
      this.sendAdminMessage(`🔧 Данные для сохранения: ${stateJson}`);
      this.sendAdminMessage(`🔧 Размер данных: ${stateJson.length} символов`);

      // Проверяем, что кэш доступен
      const testKey = `test_${Date.now()}`;
      this.cache.put(testKey, "test", 60);
      const testResult = this.cache.get(testKey);
      this.sendAdminMessage(`🔧 Тест кэша: ${testResult === "test" ? "OK" : "FAILED"}`);
      this.cache.remove(testKey);

      this.cache.put(key, stateJson, 3600);

      // Проверяем, что данные сохранились
      const savedData = this.cache.get(key);
      this.sendAdminMessage(`🔧 Проверка сохранения: ${savedData ? 'OK' : 'FAILED'}`);
      if (savedData) {
        this.sendAdminMessage(`🔧 Сохраненные данные: ${savedData}`);
        this.sendAdminMessage(`🔧 Размер сохраненных данных: ${savedData.length} символов`);
      }

      this.sendAdminMessage(`✅ Состояние установлено для ${chatId}: ${stateJson}`);

    } catch (error) {
      this.sendAdminMessage(`❌ Ошибка в setUserState для ${chatId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getUserState(chatId: number): UserState | null {
    try {
      this.sendAdminMessage(`🔍 Попытка получить состояние для ${chatId}`);

      const key = `user_state_${chatId}`;

      this.sendAdminMessage(`🔍 Ключ кэша: ${key}`);

      // Проверяем, что кэш работает
      const testKey = `test_get_${Date.now()}`;
      this.cache.put(testKey, "test_get", 60);
      const testResult = this.cache.get(testKey);
      this.sendAdminMessage(`🔍 Тест получения из кэша: ${testResult === "test_get" ? "OK" : "FAILED"}`);
      this.cache.remove(testKey);

      const stateJson = this.cache.get(key);
      this.sendAdminMessage(`🔍 Полученные данные из кэша: ${stateJson ? stateJson : 'null'}`);

      if (stateJson) {
        try {
          const state: UserState = JSON.parse(stateJson);
          this.sendAdminMessage(`✅ Получено состояние для ${chatId}: ${JSON.stringify(state)}`);
          return state;
        } catch (error) {
          this.sendAdminMessage(`❌ Ошибка парсинга состояния для ${chatId}: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      }

      this.sendAdminMessage(`❌ Состояние для ${chatId} не найдено в кэше`);
      return null;

    } catch (error) {
      this.sendAdminMessage(`❌ Ошибка в getUserState для ${chatId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  public isUserInState(chatId: number, stateType: StateType): boolean {
    const state = this.getUserState(chatId);
    const result = Boolean(state && state.type === stateType);
    this.sendAdminMessage(`🔍 isUserInState(${chatId}, ${stateType}): ${result}`);
    return result;
  }

  public clearUserState(chatId: number): void {
    const key = `user_state_${chatId}`;
    this.cache.remove(key);
    this.sendAdminMessage(`🧹 Состояние очищено для ${chatId}`);
  }

  public updateUserStateData(chatId: number, newData: Record<string, any>): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Объединяем существующие данные с новыми
      state.data = { ...state.data, ...newData };
      state.timestamp = new Date().getTime();

      const key = `user_state_${chatId}`;
      this.cache.put(key, JSON.stringify(state), 3600);

      this.sendAdminMessage(`🔄 Состояние обновлено для ${chatId}: ${JSON.stringify(state)}`);
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
      this.cache.put(key, JSON.stringify(state), 3600);

      this.sendAdminMessage(`🔄 Тип состояния обновлен для ${chatId}: ${newType}`);
      this.sendAdminMessage(`🔄 Полное состояние: ${JSON.stringify(state)}`);
    } else {
      this.sendAdminMessage(`❌ Не удалось обновить тип состояния для ${chatId}: состояние не найдено`);
    }
  }

  private sendAdminMessage(message: string): void {
    try {
      const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
      const payload = {
        chat_id: CONFIG.ADMIN_ID,
        text: message,
        parse_mode: "HTML"
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        headers: {
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      UrlFetchApp.fetch(url, options);
    } catch (error) {
      console.error('Ошибка отправки сообщения админу:', error);
    }
  }
} 