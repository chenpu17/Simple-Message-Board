const url = require('url');
const querystring = require('querystring');
const { sendHtml, sendJson, redirect, notFound, serveStatic } = require('./utils/http');
const { readBody } = require('./utils/body');
const { listMessages, createMessage, deleteMessage, fetchMessagesSince, getTotalCount } = require('./services/messageService');
const { getAllTags } = require('./services/tagService');
const { renderHomePage } = require('./templates/homePage');
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

    notFound(res);
}

async function handleHome(res, query) {
    const searchRaw = typeof query?.q === 'string' ? query.q : '';
    const pageRaw = query?.page;
    const tagFilter = query?.tag;

    const data = await listMessages(searchRaw, pageRaw, tagFilter);
    const allTags = await getAllTags();

    const html = renderHomePage({ ...data, allTags });
    sendHtml(res, html);
}

async function handleSubmit(req, res) {
    const body = await readBody(req);
    const { message, tags } = querystring.parse(body);

    // 解析标签：支持逗号分隔或空格分隔
    let tagArray = [];
    if (tags && typeof tags === 'string') {
        tagArray = tags.split(/[,，\s]+/)
            .map(t => t.trim())
            .filter(Boolean);
    }

    await createMessage(message, tagArray);
    redirect(res, '/');
}

async function handleDelete(req, res) {
    const body = await readBody(req);
    const { id, page, q, tag } = querystring.parse(body);
    const searchTerm = typeof q === 'string' ? q.trim() : '';
    const tagFilter = typeof tag === 'string' ? tag.trim() : '';

    await deleteMessage(id);

    const totalMessages = await getTotalCount();
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

module.exports = { routeRequest };
