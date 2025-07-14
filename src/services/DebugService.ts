import { CONFIG } from '../config';
import { MessageService } from './MessageService';

export class DebugService {
  private static instance: DebugService;
  private messageService: MessageService;

  private constructor() {
    this.messageService = MessageService.getInstance();
  }

  public static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService();
    }
    return DebugService.instance;
  }

  public testSendMessage(): void {
    this.messageService.sendText(Number(CONFIG.ADMIN_ID), 'Бот успешно запущен!');
  }
}
