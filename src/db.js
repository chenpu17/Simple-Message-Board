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

        // 答复表
        db.run(`
            CREATE TABLE IF NOT EXISTS replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_replies_message_id
            ON replies (message_id)
        `);

        // 统计表 - 存储历史总留言数
        db.run(`
            CREATE TABLE IF NOT EXISTS stats (
                key TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            )
        `);

        // 初始化历史总留言数（如果不存在，使用当前消息数）
        db.run(`
            INSERT OR IGNORE INTO stats (key, value)
            SELECT 'total_messages_ever', COUNT(*) FROM messages
        `);

        // 确保历史总数不小于当前消息数
        db.run(`
            UPDATE stats SET value = (SELECT COUNT(*) FROM messages)
            WHERE key = 'total_messages_ever'
            AND value < (SELECT COUNT(*) FROM messages)
        `);

        // 每日统计表 - 永久保存历史数据
        db.run(`
            CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY,
                message_count INTEGER NOT NULL DEFAULT 0,
                reply_count INTEGER NOT NULL DEFAULT 0
            )
        `);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_daily_stats_date
            ON daily_stats (date DESC)
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
