const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { DATA_DIR, DB_PATH } = require('./config');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

const db = new sqlite3.Database(DB_PATH);

function initDb() {
    ensureDataDir();
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        `);
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_messages_created_at
            ON messages (created_at DESC)
        `);
    });
}

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
        if (err) {
            reject(err);
            return;
        }
        resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(rows);
    });
});

function closeDb() {
    db.close();
}

module.exports = {
    db,
    initDb,
    dbRun,
    dbGet,
    dbAll,
    closeDb
};
