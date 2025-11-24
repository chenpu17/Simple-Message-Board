const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { DATA_DIR, DB_PATH } = require('./config');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

const db = new sqlite3.Database(DB_PATH);

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

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

        // 标签表
        db.run(`
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT NOT NULL DEFAULT '#3b82f6'
            )
        `);

        // 留言-标签关联表
        db.run(`
            CREATE TABLE IF NOT EXISTS message_tags (
                message_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (message_id, tag_id),
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_message_tags_message
            ON message_tags (message_id)
        `);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_message_tags_tag
            ON message_tags (tag_id)
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
