const url = require('url');
const querystring = require('querystring');
const { sendHtml, sendJson, redirect, notFound, serveStatic } = require('./utils/http');
const { readBody } = require('./utils/body');
const { listMessages, createMessage, deleteMessage, fetchMessagesSince, getTotalCount, getFilteredCount, getTotalMessagesEver } = require('./services/messageService');
const { getAllTags } = require('./services/tagService');
const { createReply, deleteReply } = require('./services/replyService');
const { getSummaryStats } = require('./services/statsService');
const { renderHomePage } = require('./templates/homePage');
const { renderDashboardPage } = require('./templates/dashboardPage');
const { buildListPath } = require('./utils/paths');
const { MAX_PAGES, PAGE_SIZE } = require('./config');

async function routeRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (pathname.startsWith('/static/')) {
        const served = serveStatic(req, res, pathname);
        if (served) {
            return;
        }
    }

    if (req.method === 'GET' && pathname === '/') {
        await handleHome(res, query);
        return;
    }

    if (req.method === 'GET' && pathname === '/dashboard') {
        await handleDashboard(res);
        return;
    }

    if (req.method === 'POST' && pathname === '/submit') {
        await handleSubmit(req, res);
        return;
    }

    if (req.method === 'POST' && pathname === '/delete') {
        await handleDelete(req, res);
        return;
    }

    if (req.method === 'GET' && pathname === '/api/messages') {
        await handleApiMessages(res, query);
        return;
    }

    if (req.method === 'GET' && pathname === '/api/tags') {
        await handleApiTags(res);
        return;
    }

    if (req.method === 'POST' && pathname === '/reply') {
        await handleReply(req, res);
        return;
    }

    if (req.method === 'POST' && pathname === '/delete-reply') {
        await handleDeleteReply(req, res);
        return;
    }

    notFound(res);
}

async function handleHome(res, query) {
    const searchRaw = typeof query?.q === 'string' ? query.q : '';
    const pageRaw = query?.page;
    const tagFilter = query?.tag;

    const data = await listMessages(searchRaw, pageRaw, tagFilter);
    const allTags = await getAllTags();
    const totalMessagesEver = await getTotalMessagesEver();

    const html = renderHomePage({ ...data, allTags, totalMessagesEver });
    sendHtml(res, html);
}

async function handleDashboard(res) {
    try {
        const stats = await getSummaryStats();
        const html = renderDashboardPage(stats);
        sendHtml(res, html);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>数据加载失败</h1><p>请稍后重试或<a href="/">返回首页</a></p>');
    }
}

async function handleSubmit(req, res) {
    const body = await readBody(req);
    const { message, tags } = querystring.parse(body);

    // Validate message is non-empty
    if (!message || typeof message !== 'string' || !message.trim()) {
        redirect(res, '/');
        return;
    }

    // 解析标签：支持逗号分隔或空格分隔
    let tagArray = [];
    if (tags && typeof tags === 'string') {
        tagArray = tags.split(/[,，\s]+/)
            .map(t => t.trim())
            .filter(Boolean);
    }

    await createMessage(message, tagArray);
    redirect(res, '/?submitted=1');
}

async function handleDelete(req, res) {
    const body = await readBody(req);
    const { id, page, q, tag } = querystring.parse(body);
    const searchTerm = typeof q === 'string' ? q.trim() : '';
    const tagFilter = typeof tag === 'string' ? tag.trim() : '';

    await deleteMessage(id);

    // Use filtered count instead of global count to compute correct total pages
    const totalMessages = await getFilteredCount(searchTerm, tagFilter);
    const totalPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(totalMessages / PAGE_SIZE)));

    let targetPage = Number.parseInt(page, 10);
    if (Number.isNaN(targetPage) || targetPage < 1) {
        targetPage = 1;
    }
    if (targetPage > totalPages) {
        targetPage = totalPages;
    }

    redirect(res, buildListPath(targetPage, searchTerm, tagFilter));
}

async function handleApiMessages(res, query) {
    const messages = await fetchMessagesSince(query?.since_id, query?.limit);
    sendJson(res, { messages }, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
}

async function handleApiTags(res) {
    const tags = await getAllTags();
    sendJson(res, { tags }, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
}

async function handleReply(req, res) {
    const body = await readBody(req);
    const { message_id, content, page, q, tag } = querystring.parse(body);

    const searchTerm = typeof q === 'string' ? q.trim() : '';
    const tagFilter = typeof tag === 'string' ? tag.trim() : '';
    let targetPage = Number.parseInt(page, 10);
    if (Number.isNaN(targetPage) || targetPage < 1) {
        targetPage = 1;
    }

    // Validate content is non-empty
    if (!content || typeof content !== 'string' || !content.trim()) {
        redirect(res, buildListPath(targetPage, searchTerm, tagFilter));
        return;
    }

    // Validate message_id exists
    if (!message_id) {
        redirect(res, buildListPath(targetPage, searchTerm, tagFilter));
        return;
    }

    await createReply(message_id, content);
    redirect(res, buildListPath(targetPage, searchTerm, tagFilter));
}

async function handleDeleteReply(req, res) {
    const body = await readBody(req);
    const { id, page, q, tag } = querystring.parse(body);

    await deleteReply(id);

    const searchTerm = typeof q === 'string' ? q.trim() : '';
    const tagFilter = typeof tag === 'string' ? tag.trim() : '';
    let targetPage = Number.parseInt(page, 10);
    if (Number.isNaN(targetPage) || targetPage < 1) {
        targetPage = 1;
    }

    redirect(res, buildListPath(targetPage, searchTerm, tagFilter));
}

module.exports = { routeRequest };
