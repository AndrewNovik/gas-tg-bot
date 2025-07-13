// Главный файл для сборки в bundle.js
// Импортируем все необходимые модули
import { StateManager } from './services/StateManager';
import { MessageService } from './services/MessageService';
import { CommandService } from './services/CommandService';
import { WebhookService } from './services/WebhookService';
import { DebugService } from './services/DebugService';
import { GoogleSheetsService } from './services/GoogleSheetsService';
import { TextCommandsController } from './controllers/TextCommandsController';
import { QueryCommandsController } from './controllers/QueryCommandsController';

// Инициализация сервисов
const stateManager = StateManager.getInstance();
const messageService = MessageService.getInstance();
const commandService = CommandService.getInstance();
const webhookService = WebhookService.getInstance();
const debugService = DebugService.getInstance();
const googleSheetsService = GoogleSheetsService.getInstance();

// Инициализация контроллеров
const textCommandsController = TextCommandsController.getInstance();
const queryCommandsController = QueryCommandsController.getInstance();

// Глобальные функции для GAS
function startBot() {
  commandService.deleteBotCommands();
  webhookService.deleteWebhook();
  webhookService.setWebhook();
  commandService.setupBotCommands();
  debugService.testSendMessage();
}

function doPost(e: any) {
  const update = JSON.parse(e.postData.contents);

  // Обработка текстовых сообщений
  if (update?.message?.text) {
    textCommandsController.handleTextCommand(update.message);
  }

  // Обработка callback-запросов от инлайн-кнопок
  if (update?.callback_query) {
    queryCommandsController.handleQueryCommand(update.callback_query);
  }
}

function doGet() {
  // Обработка GET запросов
  return ContentService.createTextOutput('OK');
}

// Явный экспорт в глобальную область видимости для GAS
(function (global: any) {
  global.startBot = startBot;
})(globalThis);