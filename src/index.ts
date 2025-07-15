// Главный файл для сборки в bundle.js
// Импортируем все необходимые модули
import { StateManager } from '@state';
import { MessageService } from '@messages';
import { CommandService } from '@commands';
import { WebhookService } from '@webhooks';
import { GoogleSheetsService } from '@google-sheets';
import { TextCommandsController, QueryCommandsController } from '@commands';
import { Update } from '@telegram-api';

// Инициализация сервисов
const stateManager = StateManager.getInstance();
const messageService = MessageService.getInstance();
const commandService = CommandService.getInstance();
const webhookService = WebhookService.getInstance();
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
}

function doPost(e: any) {
  const update: Update = JSON.parse(e.postData.contents);

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
  global.doPost = doPost;
  global.doGet = doGet;
})(globalThis);
