const path = require('path');

const PAGE_SIZE = 50;
const MAX_MESSAGES = 1024;
const MAX_PAGES = Math.ceil(MAX_MESSAGES / PAGE_SIZE);
const PORT = process.env.PORT ? Number(process.env.PORT) : 13478;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'messages.db');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

module.exports = {
    PAGE_SIZE,
    MAX_MESSAGES,
    MAX_PAGES,
    PORT,
    DATA_DIR,
    DB_PATH,
    PUBLIC_DIR
};
