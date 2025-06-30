function setupBotCommands() {
  const commands = [
    {
      command: 'start',
      description: 'Приветствие и краткое описание функционала'
    },
    {
      command: 'help',
      description: 'Список всех команд и инструкции по использованию'
    },
    {
      command: 'menu',
      description: 'Основное меню с кнопками быстрого доступа'
    }
  ];

  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/setMyCommands`;
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      commands: commands
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log('✅ Команды бота успешно установлены!');
      console.log('Доступные команды:');
      commands.forEach(cmd => {
        console.log(`/${cmd.command} - ${cmd.description}`);
      });
    } else {
      console.error('❌ Ошибка установки команд:', result.description);
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при установке команд:', error.message);
  }
}

function getBotCommands() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/getMyCommands`;
  
  const options = {
    method: 'GET',
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log('📋 Установленные команды:');
      if (result.result.length === 0) {
        console.log('Команды не установлены');
      } else {
        result.result.forEach(cmd => {
          console.log(`/${cmd.command} - ${cmd.description}`);
        });
      }
    } else {
      console.error('❌ Ошибка получения команд:', result.description);
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при получении команд:', error.message);
  }
}

function deleteBotCommands() {
  const url = `${CONFIG.API_URL}${CONFIG.TOKEN}/deleteMyCommands`;
  
  const options = {
    method: 'POST',
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log('✅ Все команды бота удалены');
    } else {
      console.error('❌ Ошибка удаления команд:', result.description);
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при удалении команд:', error.message);
  }
}
