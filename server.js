// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // Убираем параметры запроса
    let filePath = req.url.split('?')[0];
    
    // Если корневой путь, отдаем index.html
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }
    
    // Определяем путь к файлу
    const fullPath = path.join(__dirname, filePath);
    const extname = path.extname(fullPath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Читаем файл
    fs.readFile(fullPath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Файл не найден
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('404 - File Not Found');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // Ошибка сервера
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Успешно
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log('📁 Для остановки сервера нажмите Ctrl+C');
});