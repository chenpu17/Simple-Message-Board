const path = require('path');
const os = require('os');

const PAGE_SIZE = 20;
const MAX_MESSAGES = 1024;
const MAX_PAGES = Math.ceil(MAX_MESSAGES / PAGE_SIZE);
const PORT = process.env.PORT ? Number(process.env.PORT) : 13478;

// Support custom data directory via environment variable
// Default to ~/.message-board/data when installed globally, or ./data when running locally
const DEFAULT_DATA_DIR = process.env.DATA_DIR
    ? process.env.DATA_DIR
    : path.join(__dirname, '..', 'data');

const DATA_DIR = DEFAULT_DATA_DIR;
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
