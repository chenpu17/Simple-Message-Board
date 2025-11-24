const { dbAll, dbGet, dbRun } = require('../db');
const { PAGE_SIZE, MAX_MESSAGES, MAX_PAGES } = require('../config');
const { buildSearchClause } = require('../utils/search');
const { addTagsToMessage, getMessageTagsBatch, removeMessageTags } = require('./tagService');

async function listMessages(searchRaw, requestedPage, tagFilter) {
    const { clause: searchClause, params: searchParams, term: searchTerm } = buildSearchClause(searchRaw || '');

    let baseQuery = 'FROM messages';
    let whereClause = searchClause;
    let queryParams = [...searchParams];

    // 如果有标签过滤
    if (tagFilter) {
        const tagId = Number.parseInt(tagFilter, 10);
        if (!Number.isNaN(tagId)) {
            baseQuery += ' INNER JOIN message_tags mt ON messages.id = mt.message_id';
            if (whereClause) {
                whereClause += ' AND mt.tag_id = ?';
            } else {
                whereClause = 'WHERE mt.tag_id = ?';
            }
            queryParams.push(tagId);
        }
    }

    const totalRow = await dbGet(`SELECT COUNT(DISTINCT messages.id) AS count ${baseQuery} ${whereClause}`, queryParams);
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
    const listParams = [...queryParams, PAGE_SIZE, offset];
    const messages = await dbAll(
        `SELECT DISTINCT messages.id, messages.content, messages.created_at ${baseQuery} ${whereClause} ORDER BY datetime(messages.created_at) DESC, messages.id DESC LIMIT ? OFFSET ?`,
        listParams
    );

    // 批量获取所有留言的标签
    const messageIds = messages.map(m => m.id);
    const tagsMap = await getMessageTagsBatch(messageIds);

    // 将标签添加到留言对象中
    const messagesWithTags = messages.map(msg => ({
        ...msg,
        tags: tagsMap[msg.id] || []
    }));

    return {
        messages: messagesWithTags,
        searchTerm,
        totalMessages,
        totalPages,
        currentPage,
        tagFilter
    };
}

async function createMessage(content, tagNames) {
    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
        return null;
    }

    const createdAt = new Date().toISOString();
    const result = await dbRun('INSERT INTO messages (content, created_at) VALUES (?, ?)', [trimmed, createdAt]);
    const messageId = result.lastID;

    // 添加标签
    if (Array.isArray(tagNames) && tagNames.length > 0) {
        await addTagsToMessage(messageId, tagNames);
    }

    await pruneOverflow();

    return {
        id: messageId,
        content: trimmed,
        created_at: createdAt
    };
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

    const messages = await dbAll(sql, params);

    // 获取标签信息
    const messageIds = messages.map(m => m.id);
    const tagsMap = await getMessageTagsBatch(messageIds);

    // 将标签添加到留言对象中
    return messages.map(msg => ({
        ...msg,
        tags: tagsMap[msg.id] || []
    }));
}

async function getTotalCount() {
    const totalRow = await dbGet('SELECT COUNT(*) AS count FROM messages');
    return totalRow?.count ? Number(totalRow.count) : 0;
}

async function getFilteredCount(searchRaw, tagFilter) {
    const { clause: searchClause, params: searchParams } = buildSearchClause(searchRaw || '');

    let baseQuery = 'FROM messages';
    let whereClause = searchClause;
    let queryParams = [...searchParams];

    // 如果有标签过滤
    if (tagFilter) {
        const tagId = Number.parseInt(tagFilter, 10);
        if (!Number.isNaN(tagId)) {
            baseQuery += ' INNER JOIN message_tags mt ON messages.id = mt.message_id';
            if (whereClause) {
                whereClause += ' AND mt.tag_id = ?';
            } else {
                whereClause = 'WHERE mt.tag_id = ?';
            }
            queryParams.push(tagId);
        }
    }

    const totalRow = await dbGet(`SELECT COUNT(DISTINCT messages.id) AS count ${baseQuery} ${whereClause}`, queryParams);
    return totalRow?.count ? Number(totalRow.count) : 0;
}

module.exports = {
    listMessages,
    createMessage,
    deleteMessage,
    fetchMessagesSince,
    getTotalCount,
    getFilteredCount
};
