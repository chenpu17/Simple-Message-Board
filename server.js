const { createServer } = require('./src/server');
const { PORT } = require('./src/config');

const server = createServer();

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        process.exit(0);
    });
});
