const { dbAll, dbGet, dbRun } = require('../db');

/**
 * 获取指定留言的所有答复
 */
async function getRepliesByMessageId(messageId) {
    const id = Number.parseInt(messageId, 10);
    if (Number.isNaN(id)) {
        return [];
    }
    return await dbAll(
        'SELECT id, message_id, content, created_at FROM replies WHERE message_id = ? ORDER BY datetime(created_at) ASC, id ASC',
        [id]
    );
}

/**
 * 批量获取多条留言的答复
 */
async function getRepliesBatch(messageIds) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return {};
    }

    const placeholders = messageIds.map(() => '?').join(',');
    const replies = await dbAll(
        `SELECT id, message_id, content, created_at FROM replies WHERE message_id IN (${placeholders}) ORDER BY datetime(created_at) ASC, id ASC`,
        messageIds
    );

    // 按 message_id 分组
    const repliesMap = {};
    for (const reply of replies) {
        if (!repliesMap[reply.message_id]) {
            repliesMap[reply.message_id] = [];
        }
        repliesMap[reply.message_id].push(reply);
    }

    return repliesMap;
}

/**
 * 创建答复
 */
async function createReply(messageId, content) {
    const id = Number.parseInt(messageId, 10);
    if (Number.isNaN(id)) {
        return null;
    }

    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
        return null;
    }

    // 检查留言是否存在
    const message = await dbGet('SELECT id FROM messages WHERE id = ?', [id]);
    if (!message) {
        return null;
    }

    const createdAt = new Date().toISOString();
    const result = await dbRun(
        'INSERT INTO replies (message_id, content, created_at) VALUES (?, ?, ?)',
        [id, trimmed, createdAt]
    );

    return {
        id: result.lastID,
        message_id: id,
        content: trimmed,
        created_at: createdAt
    };
}

/**
 * 删除答复
 */
async function deleteReply(replyId) {
    const id = Number.parseInt(replyId, 10);
    if (Number.isNaN(id)) {
        return false;
    }
    await dbRun('DELETE FROM replies WHERE id = ?', [id]);
    return true;
}

/**
 * 获取留言的答复数量
 */
async function getReplyCount(messageId) {
    const id = Number.parseInt(messageId, 10);
    if (Number.isNaN(id)) {
        return 0;
    }
    const row = await dbGet('SELECT COUNT(*) AS count FROM replies WHERE message_id = ?', [id]);
    return row?.count ? Number(row.count) : 0;
}

module.exports = {
    getRepliesByMessageId,
    getRepliesBatch,
    createReply,
    deleteReply,
    getReplyCount
};
