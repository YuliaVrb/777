const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7056317634:AAEEXRtQmJXeOlZ8wci5FRrjs5ASgE24tCQ';
const TELEGRAM_CHAT_ID = '-1002087861469';

function sendMessage(message) {
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  })
  .then(response => {
    console.log('Message sent to Telegram:', response.data);
  })
  .catch(error => {
    console.error('Error sending message to Telegram:', error);
  });
}

module.exports = {
  sendMessage
};