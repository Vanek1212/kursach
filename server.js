// server.js - Упрощенная версия без Express
const http = require('http');
const fs = require('fs').promises;
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

// Путь к файлу данных
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

// Убедимся, что директория data существует
const ensureDataDirectory = async () => {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
        console.log('📁 Создана директория data');
    }
};

// Чтение данных из файла
const readData = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Если файл не существует, создаем начальные данные
        const initialData = {
            users: [],
            products: [],
            cart: [],
            orders: [],
            lastUpdate: new Date().toISOString()
        };
        
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
};

// Сохранение данных в файл
const saveData = async (data) => {
    try {
        data.lastUpdate = new Date().toISOString();
        data.lastUpdateTimestamp = Date.now();
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return { success: false, error: error.message };
    }
};

// Обработка POST запросов
const handlePostRequest = async (req, parsedUrl) => {
    return new Promise((resolve) => {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                
                if (parsedUrl.pathname === '/api/save-data') {
                    const result = await saveData(data);
                    resolve({
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify(result)
                    });
                } else {
                    resolve({
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({ error: 'API endpoint not found' })
                    });
                }
            } catch (error) {
                resolve({
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ error: 'Invalid JSON' })
                });
            }
        });
    });
};

// Обработка GET запросов
const handleGetRequest = async (parsedUrl) => {
    try {
        if (parsedUrl.pathname === '/api/get-data') {
            const data = await readData();
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data)
            };
        }
        
        // Обработка статических файлов
        let filePath = parsedUrl.pathname;
        
        // Если корневой путь, отдаем index.html
        if (filePath === '/' || filePath === '') {
            filePath = '/index.html';
        }
        
        // Убираем ведущий слэш
        if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
        }
        
        // Если запрашивают data.json, отдаем его
        if (filePath === 'data.json' || filePath === 'data/data.json') {
            const data = await readData();
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data)
            };
        }
        
        // Если путь пустой, используем index.html
        if (filePath === '') {
            filePath = 'index.html';
        }
        
        // Полный путь к файлу
        const fullPath = path.join(__dirname, filePath);
        const extname = path.extname(fullPath);
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        
        try {
            await fs.access(fullPath);
            const content = await fs.readFile(fullPath);
            
            return {
                status: 200,
                headers: { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                },
                data: content
            };
        } catch (error) {
            // Файл не найден
            return {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=UTF-8' },
                data: `<html><body><h1>404 - File Not Found</h1><p>Requested: ${filePath}</p></body></html>`
            };
        }
    } catch (error) {
        console.error('Ошибка обработки GET запроса:', error);
        return {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

// Создание сервера
const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    const parsedUrl = url.parse(req.url);
    
    try {
        let response;
        
        if (req.method === 'POST') {
            response = await handlePostRequest(req, parsedUrl);
        } else if (req.method === 'GET') {
            response = await handleGetRequest(parsedUrl);
        } else {
            response = {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }
        
        // Отправка ответа
        res.writeHead(response.status, response.headers);
        res.end(response.data);
        
    } catch (error) {
        console.error('Ошибка сервера:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
});

// Запуск сервера
const startServer = async () => {
    await ensureDataDirectory();
    
    server.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📁 Текущая директория: ${__dirname}`);
        console.log('📁 Для остановки сервера нажмите Ctrl+C');
        console.log('\n📝 Доступные страницы:');
        console.log(`   Главная: http://localhost:${PORT}/`);
        console.log(`   Данные (API): http://localhost:${PORT}/api/get-data`);
        console.log(`   Файл данных: http://localhost:${PORT}/data.json`);
        console.log('\n🔧 API эндпоинты:');
        console.log(`   GET  /api/get-data     - Получить все данные`);
        console.log(`   POST /api/save-data    - Сохранить все данные`);
    });
};

startServer().catch(console.error);

// Обработка Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Сервер остановлен');
    process.exit(0);
});