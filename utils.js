function setWebhook() {
  const webUrl = `https://script.google.com/macros/s/${CONFIG.WEB_APP_ID}/exec`;
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setWebhook?url=${webUrl}`;
  UrlFetchApp.fetch(url);
}

function getWebhookInfo() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  console.log("Информация о вебхуке:", response.getContentText());
}

function deleteWebhook() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteWebhook`;

  const options = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify({
      drop_pending_updates: true,
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (result.ok) {
    console.log("Webhook успешно удален");
    sendText(CONFIG.ADMIN_ID, "✅ Webhook удален!\n\nПендинг апдейты: удалены");
  } else {
    sendText(
      CONFIG.ADMIN_ID,
      `❌ Ошибка удаления webhook: ${result.description}`
    );
  }
}

function doGet() {}
