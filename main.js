function startBot() {
  deleteWebhook();
  setWebhook();
  testSendMessage();
}

function doPost(e) {
  const update = JSON.parse(e.postData.contents);

  if (update?.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    const firstName = update.message.from.first_name;

    // Обработка команд
    switch (text) {
      case "/start":
        sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
        break;

      case "/help":
        sendText(
          chatId,
          "Доступные команды:\n/start - приветствие\n/help - справка"
        );
        break;

      default:
        // Эхо-ответ
        sendText(chatId, `Вы написали: "${text}"`);
    }
  }
}

function sendText(chatId, text) {
  let data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: "HTML",
    },
    muteHttpExceptions: true,
  };

  return JSON.parse(
    UrlFetchApp.fetch(CONFIG.API_URL + CONFIG.TOKEN + "/", data)
  );
}

function testSendMessage() {
  sendText(CONFIG.ADMIN_ID, "Бот успешно запущен!");
}
