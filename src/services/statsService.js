const { dbAll, dbGet, dbRun } = require('../db');

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)，使用本地时区
 */
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 递增今日留言计数
 */
async function incrementDailyMessageCount() {
    const today = getTodayDate();
    await dbRun(`
        INSERT INTO daily_stats (date, message_count, reply_count)
        VALUES (?, 1, 0)
        ON CONFLICT(date) DO UPDATE SET message_count = message_count + 1
    `, [today]);
}

/**
 * 递增今日答复计数
 */
async function incrementDailyReplyCount() {
    const today = getTodayDate();
    await dbRun(`
        INSERT INTO daily_stats (date, message_count, reply_count)
        VALUES (?, 0, 1)
        ON CONFLICT(date) DO UPDATE SET reply_count = reply_count + 1
    `, [today]);
}

/**
 * 获取历史总留言数
 */
async function getTotalMessagesEver() {
    const row = await dbGet('SELECT value FROM stats WHERE key = ?', ['total_messages_ever']);
    return row?.value ? Number(row.value) : 0;
}

/**
 * 获取当前留言数
 */
async function getCurrentMessageCount() {
    const row = await dbGet('SELECT COUNT(*) AS count FROM messages');
    return row?.count ? Number(row.count) : 0;
}

/**
 * 获取当前答复数
 */
async function getCurrentReplyCount() {
    const row = await dbGet('SELECT COUNT(*) AS count FROM replies');
    return row?.count ? Number(row.count) : 0;
}

/**
 * 获取每日统计数据（最近N天）
 */
async function getDailyStats(days = 30) {
    const safeDays = Math.min(Math.max(1, Number(days) || 30), 365);
    const rows = await dbAll(`
        SELECT date, message_count, reply_count
        FROM daily_stats
        ORDER BY date DESC
        LIMIT ?
    `, [safeDays]);
    return rows.reverse();
}

/**
 * 获取标签使用排行
 */
async function getTagRanking(limit = 10) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
    const rows = await dbAll(`
        SELECT t.id, t.name, t.color, COUNT(mt.message_id) AS usage_count
        FROM tags t
        LEFT JOIN message_tags mt ON t.id = mt.tag_id
        GROUP BY t.id
        ORDER BY usage_count DESC
        LIMIT ?
    `, [safeLimit]);
    return rows;
}

/**
 * 获取留言活跃时段分布（按小时，最近90天数据）
 */
async function getHourlyDistribution() {
    const rows = await dbAll(`
        SELECT
            CAST(strftime('%H', created_at) AS INTEGER) AS hour,
            COUNT(*) AS count
        FROM messages
        WHERE created_at >= date('now', '-90 days')
        GROUP BY hour
        ORDER BY hour
    `);

    // 填充所有24小时
    const distribution = new Array(24).fill(0);
    rows.forEach(row => {
        distribution[row.hour] = row.count;
    });
    return distribution;
}

/**
 * 获取最热门留言（答复最多）
 */
async function getTopMessages(limit = 5) {
    const rows = await dbAll(`
        SELECT
            m.id,
            m.content,
            m.created_at,
            COUNT(r.id) AS reply_count
        FROM messages m
        LEFT JOIN replies r ON m.id = r.message_id
        GROUP BY m.id
        HAVING reply_count > 0
        ORDER BY reply_count DESC
        LIMIT ?
    `, [limit]);
    return rows;
}

/**
 * 获取平均留言长度
 */
async function getAverageMessageLength() {
    const row = await dbGet('SELECT AVG(LENGTH(content)) AS avg_length FROM messages');
    return row?.avg_length ? Math.round(row.avg_length) : 0;
}

/**
 * 获取汇总统计数据
 */
async function getSummaryStats() {
    const [
        totalMessagesEver,
        currentMessageCount,
        currentReplyCount,
        avgMessageLength,
        tagRanking,
        hourlyDistribution,
        topMessages,
        dailyStats
    ] = await Promise.all([
        getTotalMessagesEver(),
        getCurrentMessageCount(),
        getCurrentReplyCount(),
        getAverageMessageLength(),
        getTagRanking(10),
        getHourlyDistribution(),
        getTopMessages(5),
        getDailyStats(30)
    ]);

    return {
        totalMessagesEver,
        currentMessageCount,
        currentReplyCount,
        avgMessageLength,
        tagRanking,
        hourlyDistribution,
        topMessages,
        dailyStats
    };
}

module.exports = {
    getTodayDate,
    incrementDailyMessageCount,
    incrementDailyReplyCount,
    getTotalMessagesEver,
    getCurrentMessageCount,
    getCurrentReplyCount,
    getDailyStats,
    getTagRanking,
    getHourlyDistribution,
    getTopMessages,
    getAverageMessageLength,
    getSummaryStats
};
