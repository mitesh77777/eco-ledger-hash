const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/recs.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS recs (
        id TEXT PRIMARY KEY,
        token_id TEXT,
        energy_source TEXT,
        location TEXT,
        mwh INTEGER,
        price REAL,
        generation_date TEXT,
        status TEXT DEFAULT 'available',
        owner_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        rec_id TEXT,
        buyer_id TEXT,
        seller_id TEXT,
        amount REAL,
        hedera_tx_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }

  createREC(data) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO recs (id, token_id, energy_source, location, mwh, price, generation_date, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        [data.id, data.tokenId, data.energySource, data.location, data.mwh, data.price, data.generationDate, data.ownerId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getAllRECs() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM recs WHERE status = "available"', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getRECsByOwner(ownerId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM recs WHERE owner_id = ?', [ownerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getRECById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM recs WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  updateRECOwner(id, newOwnerId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE recs SET owner_id = ?, status = "sold" WHERE id = ?',
        [newOwnerId, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  updateRECStatus(id, status) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE recs SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  createTransaction(data) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO transactions (id, rec_id, buyer_id, seller_id, amount, hedera_tx_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run([data.id, data.recId, data.buyerId, data.sellerId, data.amount, data.hederaTxId], function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }
}

module.exports = new Database();
