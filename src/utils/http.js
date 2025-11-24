const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR } = require('../config');

const MIME_TYPES = {
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
};

function sendHtml(res, html, status = 200) {
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
}

function sendJson(res, payload, status = 200, headers = {}) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers
    });
    res.end(JSON.stringify(payload));
}

function sendText(res, message, status = 200) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
}

function redirect(res, location) {
    res.writeHead(302, { Location: location });
    res.end();
}

function notFound(res) {
    sendText(res, '404 Not Found', 404);
}

function serveStatic(req, res, pathname) {
    const relativePath = pathname.replace(/^\/static\//, '');
    const fullPath = path.join(PUBLIC_DIR, relativePath);

    if (!fullPath.startsWith(PUBLIC_DIR)) {
        notFound(res);
        return true;
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        return false;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
    return true;
}

module.exports = {
    sendHtml,
    sendJson,
    sendText,
    redirect,
    notFound,
    serveStatic
};
