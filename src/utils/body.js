function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk.toString('utf8');
            if (data.length > 1e6) {
                req.socket.destroy();
                reject(new Error('Request body too large'));
            }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

module.exports = { readBody };
