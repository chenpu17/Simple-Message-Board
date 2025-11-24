const { dbAll, dbGet, dbRun } = require('../db');

// 预定义的标签颜色
const TAG_COLORS = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#f59e0b', // 橙色
    '#ef4444', // 红色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#06b6d4', // 青色
    '#84cc16'  // 黄绿色
];

/**
 * 获取所有标签及其留言数量
 */
async function getAllTags() {
    const sql = `
        SELECT
            t.id,
            t.name,
            t.color,
            COUNT(mt.message_id) as message_count
        FROM tags t
        LEFT JOIN message_tags mt ON t.id = mt.tag_id
        GROUP BY t.id
        ORDER BY message_count DESC, t.name ASC
    `;
    return await dbAll(sql);
}

/**
 * 根据名称获取或创建标签
 */
async function getOrCreateTag(tagName) {
    const trimmed = tagName.trim();
    if (!trimmed) {
        return null;
    }

    // 先尝试获取已存在的标签
    const existing = await dbGet('SELECT * FROM tags WHERE name = ?', [trimmed]);
    if (existing) {
        return existing;
    }

    // 创建新标签，随机选择颜色
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    const result = await dbRun('INSERT INTO tags (name, color) VALUES (?, ?)', [trimmed, color]);

    return {
        id: result.lastID,
        name: trimmed,
        color
    };
}

/**
 * 为留言添加标签
 */
async function addTagsToMessage(messageId, tagNames) {
    if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return [];
    }

    const tags = [];
    for (const tagName of tagNames) {
        const tag = await getOrCreateTag(tagName);
        if (tag) {
            // 添加留言-标签关联
            try {
                await dbRun(
                    'INSERT OR IGNORE INTO message_tags (message_id, tag_id) VALUES (?, ?)',
                    [messageId, tag.id]
                );
                tags.push(tag);
            } catch (error) {
                console.error('Failed to add tag to message:', error);
            }
        }
    }

    return tags;
}

/**
 * 获取留言的所有标签
 */
async function getMessageTags(messageId) {
    const sql = `
        SELECT t.id, t.name, t.color
        FROM tags t
        INNER JOIN message_tags mt ON t.id = mt.tag_id
        WHERE mt.message_id = ?
        ORDER BY t.name ASC
    `;
    return await dbAll(sql, [messageId]);
}

/**
 * 批量获取多条留言的标签
 */
async function getMessageTagsBatch(messageIds) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return {};
    }

    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `
        SELECT mt.message_id, t.id, t.name, t.color
        FROM tags t
        INNER JOIN message_tags mt ON t.id = mt.tag_id
        WHERE mt.message_id IN (${placeholders})
        ORDER BY t.name ASC
    `;

    const rows = await dbAll(sql, messageIds);

    // 组织成 { messageId: [tags] } 的格式
    const result = {};
    for (const row of rows) {
        if (!result[row.message_id]) {
            result[row.message_id] = [];
        }
        result[row.message_id].push({
            id: row.id,
            name: row.name,
            color: row.color
        });
    }

    return result;
}

/**
 * 删除留言的所有标签
 */
async function removeMessageTags(messageId) {
    await dbRun('DELETE FROM message_tags WHERE message_id = ?', [messageId]);
}

module.exports = {
    getAllTags,
    getOrCreateTag,
    addTagsToMessage,
    getMessageTags,
    getMessageTagsBatch,
    removeMessageTags
};
