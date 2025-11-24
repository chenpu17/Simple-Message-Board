const { dbAll, dbGet, dbRun } = require('../db');
const { PAGE_SIZE, MAX_MESSAGES, MAX_PAGES } = require('../config');
const { buildSearchClause } = require('../utils/search');

async function listMessages(searchRaw, requestedPage) {
    const { clause: searchClause, params: searchParams, term: searchTerm } = buildSearchClause(searchRaw || '');

    const totalRow = await dbGet(`SELECT COUNT(*) AS count FROM messages ${searchClause}`, searchParams);
    const totalMessages = totalRow?.count ? Number(totalRow.count) : 0;
    const totalPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(Math.max(totalMessages, 1) / PAGE_SIZE)));

    let currentPage = Number.parseInt(requestedPage, 10);
    if (Number.isNaN(currentPage) || currentPage < 1) {
        currentPage = 1;
    }
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const offset = (currentPage - 1) * PAGE_SIZE;
    const listParams = [...searchParams, PAGE_SIZE, offset];
    const messages = await dbAll(
        `SELECT id, content, created_at FROM messages ${searchClause} ORDER BY datetime(created_at) DESC, id DESC LIMIT ? OFFSET ?`,
        listParams
    );

    return {
        messages,
        searchTerm,
        totalMessages,
        totalPages,
        currentPage
    };
}

async function createMessage(content) {
    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
        return null;
    }

    const createdAt = new Date().toISOString();
    await dbRun('INSERT INTO messages (content, created_at) VALUES (?, ?)', [trimmed, createdAt]);
    await pruneOverflow();
    return { content: trimmed, created_at: createdAt };
}

async function deleteMessage(id) {
    const messageId = Number.parseInt(id, 10);
    if (Number.isNaN(messageId)) {
        return false;
    }
    await dbRun('DELETE FROM messages WHERE id = ?', [messageId]);
    return true;
}

async function pruneOverflow() {
    const totalRow = await dbGet('SELECT COUNT(*) AS count FROM messages');
    const totalMessages = totalRow?.count ? Number(totalRow.count) : 0;
    const overflow = totalMessages - MAX_MESSAGES;
    if (overflow > 0) {
        await dbRun(
            'DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY datetime(created_at) ASC, id ASC LIMIT ?)',
            [overflow]
        );
    }
}

async function fetchMessagesSince(sinceIdRaw, limitRaw) {
    const sinceId = Number.parseInt(sinceIdRaw, 10);
    const limit = Math.max(1, Math.min(Number.parseInt(limitRaw, 10) || PAGE_SIZE, 100));

    let sql = 'SELECT id, content, created_at FROM messages';
    const params = [];

    if (!Number.isNaN(sinceId) && sinceId > 0) {
        sql += ' WHERE id > ?';
        params.push(sinceId);
    }

    sql += ' ORDER BY id ASC LIMIT ?';
    params.push(limit);

    return dbAll(sql, params);
}

async function getTotalCount() {
    const totalRow = await dbGet('SELECT COUNT(*) AS count FROM messages');
    return totalRow?.count ? Number(totalRow.count) : 0;
}

module.exports = {
    listMessages,
    createMessage,
    deleteMessage,
    fetchMessagesSince,
    getTotalCount
};
