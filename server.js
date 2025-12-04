// server.js - Улучшенная версия
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // Парсим URL
    const parsedUrl = url.parse(req.url);
    let filePath = parsedUrl.pathname;
    
    // Если корневой путь, отдаем index.html
    if (filePath === '/' || filePath === '' || filePath === '/index.html') {
        filePath = '/index.html';
    }
    
    // Убираем ведущий слэш для безопасного использования с path.join
    if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
    }
    
    // Если запрашивают data.json, отдаем его из корня
    if (filePath === 'data.json') {
        filePath = 'data.json';
    }
    
    // Определяем полный путь к файлу
    const fullPath = path.join(__dirname, filePath);
    const extname = path.extname(fullPath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Проверяем существование файла
    fs.exists(fullPath, (exists) => {
        if (!exists) {
            // Пробуем альтернативные пути для data.json
            if (filePath === 'data.json') {
                const altPaths = [
                    path.join(__dirname, 'data/data.json'),
                    path.join(__dirname, '../data.json'),
                    path.join(__dirname, './data.json')
                ];
                
                let found = false;
                for (const altPath of altPaths) {
                    if (fs.existsSync(altPath)) {
                        serveFile(altPath, contentType);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    send404(res);
                }
                return;
            }
            
            // Файл не найден
            send404(res);
            return;
        }
        
        serveFile(fullPath, contentType);
    });
    
    function serveFile(filePath, contentType) {
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    send404(res);
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                });
                res.end(content, 'utf-8');
            }
        });
    }
    
    function send404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`
            <html>
                <head><title>404 Not Found</title></head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file was not found on this server.</p>
                    <p>Requested: ${req.url}</p>
                </body>
            </html>
        `);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Текущая директория: ${__dirname}`);
    console.log('📁 Для остановки сервера нажмите Ctrl+C');
    console.log('\n📝 Доступные страницы:');
    console.log(`   Главная: http://localhost:${PORT}/`);
    console.log(`   Магазин: http://localhost:${PORT}/pages/shop.html`);
    console.log(`   Данные: http://localhost:${PORT}/data.json`);
});

// Обработка Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Сервер остановлен');
    process.exit(0);
});