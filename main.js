function doPost(e) {
    const update = JSON.parse(e.postData.contents);
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from.first_name;
      
      // Обработка команд
      switch(text) {
        case '/start':
          sendText(chatId, `Привет, ${firstName}! Я простой бот на GAS.`);
          break;
          
        case '/help':
          sendText(chatId, 'Доступные команды:\n/start - приветствие\n/help - справка');
          break;
          
        default:
          // Эхо-ответ
          sendText(chatId, `Вы написали: "${text}"`);
      }
    }  
}

function sendText(chatId, text) {
  let data = {
    method: 'post',
    payload: {
      method: 'sendMessage',
      chat_id: String(chatId),
      text: text,
      parse_mode: 'HTML'
    },
    muteHttpExceptions: true
  };

  return JSON.parse(UrlFetchApp.fetch(CONFIG.API_URL + CONFIG.TOKEN + '/', data));
}

function setWebhook() {
  const webUrl = `https://script.google.com/macros/s/${CONFIG.WEB_APP_ID}/exec`;
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setWebhook?url=${webUrl}`;
  const response = UrlFetchApp.fetch(url);
  console.log('Webhook установлен:', response.getContentText());
}

function getWebhookInfo() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  console.log('Информация о вебхуке:', response.getContentText());
}

function deleteWebhook(dropPendingUpdates = true) {
  try {
    const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteWebhook`;
    
    const payload = {
      drop_pending_updates: dropPendingUpdates
    };
    
    const options = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log('Webhook успешно удален');
      sendText(CONFIG.ADMIN_ID, '✅ Webhook удален!\n\nПендинг апдейты: ' + (dropPendingUpdates ? 'удалены' : 'сохранены'));
    } else {
      sendText(CONFIG.ADMIN_ID, `❌ Ошибка удаления webhook: ${result.description}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Критическая ошибка удаления webhook:', error);
    sendText(CONFIG.ADMIN_ID, `❌ Критическая ошибка удаления webhook: ${error.toString()}`);
    return null;
  }
}

function testSendMessage() {
  sendText(CONFIG.ADMIN_ID, 'Бот успешно запущен!');
}

function doGet() {}