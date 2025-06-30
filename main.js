function startBot() {
  deleteBotCommands();
  deleteWebhook();
  setWebhook();
  setupBotCommands();
  testSendMessage();
}

function doPost(e) {
  const update = JSON.parse(e.postData.contents);

  // Обработка текстовых сообщений
  if (update?.message?.text) {
    textCommandsController(update.message);
  }

  // Обработка callback-запросов от инлайн-кнопок
  if (update?.callback_query) {
    queryCommandsController(update.callback_query);
  }
}

function doGet() {}
