const url = require('url');
const querystring = require('querystring');
const { sendHtml, sendJson, redirect, notFound, serveStatic } = require('./utils/http');
const { readBody } = require('./utils/body');
const { listMessages, createMessage, deleteMessage, fetchMessagesSince, getTotalCount } = require('./services/messageService');
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

    notFound(res);
}

async function handleHome(res, query) {
    const searchRaw = typeof query?.q === 'string' ? query.q : '';
    const pageRaw = query?.page;
    const data = await listMessages(searchRaw, pageRaw);
    const html = renderHomePage({ ...data });
    sendHtml(res, html);
}

async function handleSubmit(req, res) {
    const body = await readBody(req);
    const { message } = querystring.parse(body);
    await createMessage(message);
    redirect(res, '/');
}

async function handleDelete(req, res) {
    const body = await readBody(req);
    const { id, page, q } = querystring.parse(body);
    const searchTerm = typeof q === 'string' ? q.trim() : '';

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

    redirect(res, buildListPath(targetPage, searchTerm));
}

async function handleApiMessages(res, query) {
    const messages = await fetchMessagesSince(query?.since_id, query?.limit);
    sendJson(res, { messages }, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
}

module.exports = { routeRequest };
