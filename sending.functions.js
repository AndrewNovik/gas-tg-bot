function sendText(chatId, text) {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function sendMenu(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "ℹ️ Справка", callback_data: "help" },
        { text: "👋 Приветствие", callback_data: "start" }
      ],
      [
        { text: "📊 Статистика", callback_data: "stats" },
        { text: "⚙️ Настройки", callback_data: "settings" }
      ]
    ]
  };

  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: "🎛️ Основное меню\n\nВыберите действие:",
    parse_mode: "HTML",
    reply_markup: JSON.stringify(keyboard)
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}