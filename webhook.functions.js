function setWebhook() {
  const webUrl = `https://script.google.com/macros/s/${CONFIG.WEB_APP_ID}/exec`;
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setWebhook`;
  
  const payload = {
    url: webUrl,
    allowed_updates: ["message", "callback_query"]
  };

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (result.ok) {
    console.log("✅ Webhook успешно установлен с поддержкой callback_query");
  } else {
    console.log(`❌ Ошибка установки webhook: ${result.description}`);
  }
}

function getWebhookInfo() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  console.log("Информация о вебхуке:", response.getContentText());
}

function deleteWebhook() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteWebhook`;

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify({
      drop_pending_updates: true,
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (result.ok) {
    console.log("✅ Webhook успешно удален");
  } else {
    console.log(`❌ Ошибка удаления webhook: ${result.description}`);
  }
}