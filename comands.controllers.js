function textCommandsController(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const firstName = message.from.first_name;

  switch (text) {
    case "/start":
      sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
      break;

    case "/help":
      sendText(
        chatId,
        "Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню"
      );
      break;

    case "/menu":
      sendMenu(chatId);
      break;

    default:
      // Эхо-ответ
      sendText(chatId, `Вы написали: "${text}"`);
  }
}

function queryCommandsController(query) {
  const chatId = query.message.chat.id;
  const data = query.data;
  const firstName = query.from.first_name;

  // Ответ на callback - ОБЯЗАТЕЛЬНО в течение 10 секунд
  answerCallbackQuery(query.id);

  switch (data) {
    case "start":
      sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
      break;

    case "help":
      sendText(
        chatId,
        "Доступные команды:\n/start - приветствие\n/help - справка\n/menu - основное меню"
      );
      break;

    case "stats":
      sendText(chatId, "📊 Статистика пока недоступна");
      break;

    case "settings":
      sendText(chatId, "⚙️ Настройки пока недоступны");
      break;

    default:
      sendText(chatId, "Неизвестная команда");
  }
}

function answerCallbackQuery(callbackQueryId) {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/answerCallbackQuery`;
  
  const payload = {
    callback_query_id: callbackQueryId
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      console.error('❌ Ошибка answerCallbackQuery:', result.description);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка answerCallbackQuery:', error.message);
    return { ok: false, description: error.message };
  }
}
