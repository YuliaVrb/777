const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');

const db = new sqlite3.Database('visitors.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL UNIQUE,
    geo TEXT,
    last_visit TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    wallet_address TEXT,
    network TEXT,
    balance REAL,
    last_update TIMESTAMP,
    FOREIGN KEY (ip) REFERENCES visitors(ip)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS token_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT,
    token_symbol TEXT,
    token_balance REAL,
    network TEXT,
    last_update TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES wallets(wallet_address)
  )`);
});

function logVisit(ip, geo, callback) {
  const time = moment().format();
  db.get('SELECT * FROM visitors WHERE ip = ?', [ip], (err, row) => {
    if (row) {
      db.run('UPDATE visitors SET last_visit = ? WHERE ip = ?', [time, ip]);
      callback('repeat');
    } else {
      db.run('INSERT INTO visitors (ip, geo, last_visit) VALUES (?, ?, ?)', [ip, geo, time]);
      callback('new');
    }
  });
}

function saveWallet(ip, wallet_address, network, balance, callback) {
  db.run('INSERT INTO wallets (ip, wallet_address, network, balance, last_update) VALUES (?, ?, ?, ?, ?)', 
    [ip, wallet_address, network, balance, moment().format()], 
    callback
  );
}

function saveTokenBalance(wallet_address, token_symbol, token_balance, network, callback) {
  db.run('INSERT INTO token_balances (wallet_address, token_symbol, token_balance, network, last_update) VALUES (?, ?, ?, ?, ?)', 
    [wallet_address, token_symbol, token_balance, network, moment().format()], 
    callback
  );
}

function getWallet(ip, callback) {
  db.get('SELECT * FROM wallets WHERE ip = ?', [ip], (err, row) => {
    callback(row);
  });
}

function getTokenBalances(wallet_address, callback) {
  db.all('SELECT * FROM token_balances WHERE wallet_address = ?', [wallet_address], (err, rows) => {
    callback(rows);
  });
}

module.exports = {
  logVisit,
  saveWallet,
  saveTokenBalance,
  getWallet,
  getTokenBalances
};
