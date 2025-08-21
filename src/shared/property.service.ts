import { config } from '../../config';

function setSecrets() {
  PropertiesService.getScriptProperties().setProperties(config);
}

function getToken() {
  return PropertiesService.getScriptProperties().getProperty('TOKEN');
}

function getBotId() {
  return PropertiesService.getScriptProperties().getProperty('BOT_ID');
}

function getWebAppId() {
  return PropertiesService.getScriptProperties().getProperty('WEB_APP_ID');
}

function getApiUrl() {
  return PropertiesService.getScriptProperties().getProperty('API_URL');
}

function getAdminId() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_ID');
}

function getSpreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
}

export { setSecrets, getToken, getBotId, getWebAppId, getApiUrl, getAdminId, getSpreadsheetId };
