import { startMenuReplyKeyboard } from '@commands/consts';
import { MessageService } from '@messages/services/message.service';
import { USER_STATE_KEY, UserStateInterface, STATE_STEPS, CACHE_TIMEOUT } from '@state';

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

  public resetUser(chatId: number): void {
    this.clearUserState(chatId);
    this.messageService.restartUser(chatId);
    this.setUserState(chatId, STATE_STEPS.DEFAULT);
  }

  // Установить конкретный стейт юзера, если передать только чат айди, будет задан дефолтный стейт
  public setUserState(
    chatId: number,
    step: STATE_STEPS = STATE_STEPS.DEFAULT,
    data: Record<string, any> = {},
  ): void {
    const state: UserStateInterface = { step, data };

    this.cache.put(`${USER_STATE_KEY}${chatId}`, JSON.stringify(state), CACHE_TIMEOUT);
  }

  // Получить конкретный стейт юзера
  public getUserState(chatId: number): UserStateInterface | null {
    return this.cache.get(`${USER_STATE_KEY}${chatId}`)
      ? JSON.parse(this.cache.get(`${USER_STATE_KEY}${chatId}`) as string)
      : null;
  }

  // Проверка на то состоит ли юзер в конкретном степе
  public isUserInStep(chatId: number, step: STATE_STEPS): boolean {
    const state = this.getUserState(chatId);
    return Boolean(state && state.step === step);
  }

  // Принудительная очистка стейта юзера из кеша
  public clearUserState(chatId: number): void {
    this.cache.remove(`${USER_STATE_KEY}${chatId}`);
  }

  // Обновить только данные, без степа, если юзер не состоит в степе, то будет задан дефолтный стейт и data
  public updateUserStateData(chatId: number, newData: Record<string, any>): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Объединяем существующие данные с новыми
      state.data = { ...state.data, ...newData };

      const key = `${USER_STATE_KEY}${chatId}`;
      this.cache.put(key, JSON.stringify(state), CACHE_TIMEOUT);
    } else {
      this.resetUser(chatId);
    }
  }

  // Обновить только степ, без данных, если юзер не состоит в кеше
  public updateUserStateStep(chatId: number, newStep: STATE_STEPS): void {
    const state = this.getUserState(chatId);
    if (state) {
      // Обновляем только тип состояния, сохраняя все данные
      state.step = newStep;

      const key = `${USER_STATE_KEY}${chatId}`;
      this.cache.put(key, JSON.stringify(state), CACHE_TIMEOUT);
    } else {
      this.resetUser(chatId);
    }
  }
}
