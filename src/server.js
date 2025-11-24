const http = require('http');
const { routeRequest } = require('./routes');
const { initDb, closeDb } = require('./db');

function createServer() {
    initDb();

    const server = http.createServer((req, res) => {
        routeRequest(req, res).catch((error) => {
            console.error('Request handling failed:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            }
            res.end('服务器内部错误');
        });
    });

    server.on('close', () => {
        closeDb();
    });

    return server;
}

module.exports = { createServer };
