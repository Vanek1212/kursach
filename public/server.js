const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');

// Создаем JSON Server
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Настройка порта
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'db.json');

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================

function initDatabase() {
  if (!fs.existsSync(dbPath)) {
    const defaultData = {
      users: [
        {
          id: 1,
          email: "user1@example.com",
          password: "password123",
          name: "Алексей Иванов",
          avatar: "https://i.pravatar.cc/150?img=1",
          phone: "+7 (999) 123-45-67",
          address: "ул. Пушкина, д. 10, кв. 5",
          registrationDate: "2023-01-15"
        }
      ],
      products: [
        {
          id: 1,
          name: "Waterless Shampoo Paste",
          price: 24,
          oldPrice: 26,
          image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
          reviews: 85,
          description: "Безводный шампунь-паста для любых типов волос",
          category: "hair",
          volume: "100ml",
          ingredients: ["Cocoa Butter", "Aloe Vera", "Vitamin E"],
          features: ["Без воды", "Веганский", "Без пластика"]
        }
      ],
      cart: [],
      orders: [],
      lastUpdate: new Date().toISOString(),
      lastUpdateTimestamp: Date.now()
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    console.log('✅ База данных создана:', dbPath);
  }
}

// ==================== ПРОМЕЖУТОЧНЫЕ ОБРАБОТЧИКИ ====================

// Подключаем middleware
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Добавляем кастомные заголовки CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Логирование запросов
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==================== КАСТОМНЫЕ МАРШРУТЫ ====================

// 1. Аутентификация пользователя (POST /auth/login)
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db.getState();
  
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      token: `token_${Date.now()}_${user.id}`,
      user: userWithoutPassword
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Неверный email или пароль'
    });
  }
});

// 2. Проверка email (GET /users/check-email/:email)
server.get('/users/check-email/:email', (req, res) => {
  const { email } = req.params;
  const db = router.db.getState();
  const exists = db.users.some(u => u.email === email);
  res.json({ exists });
});

// 3. Регистрация пользователя (POST /users/register)
server.post('/users/register', (req, res) => {
  const userData = req.body;
  const db = router.db.getState();
  
  // Проверка email
  const emailExists = db.users.some(u => u.email === userData.email);
  if (emailExists) {
    return res.status(400).json({ 
      success: false, 
      error: 'Пользователь с таким email уже существует' 
    });
  }
  
  // Создание нового пользователя
  const newUser = {
    id: Date.now(),
    registrationDate: new Date().toISOString().split('T')[0],
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
    isActive: true,
    ...userData
  };
  
  // Добавляем пользователя в базу
  router.db.get('users').push(newUser).write();
  
  // Убираем пароль из ответа
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json({
    success: true,
    user: userWithoutPassword
  });
});

// 4. Поиск товаров (GET /products/search?q=query)
server.get('/products/search', (req, res) => {
  const { q, category } = req.query;
  const db = router.db.getState();
  
  let results = [...db.products];
  
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
  }
  
  if (category) {
    results = results.filter(product => product.category === category);
  }
  
  res.json(results);
});

// 5. Популярные товары (GET /products/popular?limit=5)
server.get('/products/popular', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const db = router.db.getState();
  
  const popular = [...db.products]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, limit);
  
  res.json(popular);
});

// 6. Корзина пользователя (GET /cart/user/:userId)
server.get('/cart/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = router.db.getState();
  
  const userCart = db.cart.filter(item => item.userId == userId);
  res.json(userCart);
});

// 7. Умное обновление корзины (POST /cart/update)
server.post('/cart/update', (req, res) => {
  const { userId, productId, quantity } = req.body;
  const db = router.db.getState();
  
  // Находим существующий элемент
  const existingIndex = db.cart.findIndex(
    item => item.userId == userId && item.productId == productId
  );
  
  if (existingIndex !== -1) {
    if (quantity <= 0) {
      // Удаляем если количество 0 или меньше
      router.db.get('cart').remove({ 
        userId: parseInt(userId), 
        productId: parseInt(productId) 
      }).write();
    } else {
      // Обновляем количество
      router.db.get('cart')
        .find({ userId: parseInt(userId), productId: parseInt(productId) })
        .assign({ quantity })
        .write();
    }
  } else if (quantity > 0) {
    // Добавляем новый элемент
    router.db.get('cart').push({
      id: Date.now(),
      userId: parseInt(userId),
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      addedDate: new Date().toISOString().split('T')[0]
    }).write();
  }
  
  res.json({ success: true });
});

// 8. Создание заказа из корзины (POST /orders/create-from-cart)
server.post('/orders/create-from-cart', (req, res) => {
  const { userId, deliveryAddress, paymentMethod } = req.body;
  const db = router.db.getState();
  
  // Получаем корзину пользователя
  const userCart = db.cart.filter(item => item.userId == userId);
  
  if (userCart.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Корзина пуста'
    });
  }
  
  // Рассчитываем общую сумму и формируем продукты
  let total = 0;
  const products = userCart.map(cartItem => {
    const product = db.products.find(p => p.id == cartItem.productId);
    const itemTotal = (product?.price || 0) * cartItem.quantity;
    total += itemTotal;
    
    return {
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      price: product?.price || 0,
      itemTotal: itemTotal,
      productName: product?.name || `Товар #${cartItem.productId}`
    };
  });
  
  // Создаем заказ
  const newOrder = {
    id: Date.now(),
    userId: parseInt(userId),
    products,
    total,
    status: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryAddress: deliveryAddress || 'Не указан',
    paymentMethod: paymentMethod || 'card'
  };
  
  // Добавляем заказ
  router.db.get('orders').push(newOrder).write();
  
  // Очищаем корзину пользователя
  router.db.get('cart')
    .remove({ userId: parseInt(userId) })
    .write();
  
  res.json({
    success: true,
    orderId: newOrder.id,
    total: newOrder.total
  });
});

// 9. Заказы пользователя (GET /orders/user/:userId)
server.get('/orders/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = router.db.getState();
  
  const userOrders = db.orders.filter(order => order.userId == userId);
  res.json(userOrders);
});

// 10. Статистика (GET /stats)
server.get('/stats', (req, res) => {
  const db = router.db.getState();
  
  const stats = {
    totalUsers: db.users.length,
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    totalCartItems: db.cart.length,
    lastUpdate: db.lastUpdate || new Date().toISOString()
  };
  
  res.json(stats);
});
// ===== КОРЗИНА ДЛЯ ФРОНТЕНДА =====

// 11. Получить корзину пользователя
server.get('/api/cart/user/:userId', (req, res) => {
    const { userId } = req.params;
    const db = router.db.getState();
    
    const userCart = db.cart.filter(item => item.userId == userId);
    res.json(userCart);
});

// 12. Добавить в корзину
server.post('/api/cart/add', (req, res) => {
    const { userId, productId, quantity } = req.body;
    const db = router.db.getState();
    
    // Проверяем существование товара
    const product = db.products.find(p => p.id == productId);
    if (!product) {
        return res.status(404).json({ 
            success: false, 
            error: 'Товар не найден' 
        });
    }
    
    // Ищем товар в корзине
    const existingItemIndex = db.cart.findIndex(
        item => item.userId == userId && item.productId == productId
    );
    
    if (existingItemIndex !== -1) {
        // Обновляем количество
        const newQuantity = db.cart[existingItemIndex].quantity + (quantity || 1);
        db.cart[existingItemIndex].quantity = newQuantity;
    } else {
        // Добавляем новый
        const newItem = {
            id: Date.now(),
            userId: parseInt(userId),
            productId: parseInt(productId),
            quantity: quantity || 1,
            addedDate: new Date().toISOString().split('T')[0]
        };
        db.cart.push(newItem);
    }
    
    // Сохраняем изменения
    router.db.setState(db);
    
    res.json({ 
        success: true,
        message: 'Товар добавлен в корзину'
    });
});

// 13. Обновить количество
server.put('/api/cart/update', (req, res) => {
    const { userId, productId, quantity } = req.body;
    const db = router.db.getState();
    
    const itemIndex = db.cart.findIndex(
        item => item.userId == userId && item.productId == productId
    );
    
    if (itemIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            error: 'Товар не найден в корзине' 
        });
    }
    
    if (quantity <= 0) {
        // Удаляем если количество 0 или меньше
        db.cart.splice(itemIndex, 1);
    } else {
        // Обновляем количество
        db.cart[itemIndex].quantity = quantity;
    }
    
    router.db.setState(db);
    
    res.json({ 
        success: true,
        message: 'Количество обновлено'
    });
});

// 14. Удалить из корзины
server.delete('/api/cart/remove/:userId/:productId', (req, res) => {
    const { userId, productId } = req.params;
    const db = router.db.getState();
    
    const initialLength = db.cart.length;
    db.cart = db.cart.filter(
        item => !(item.userId == userId && item.productId == productId)
    );
    
    if (db.cart.length < initialLength) {
        router.db.setState(db);
        res.json({ 
            success: true,
            message: 'Товар удален из корзины'
        });
    } else {
        res.status(404).json({ 
            success: false, 
            error: 'Товар не найден в корзине' 
        });
    }
});

// 15. Очистить корзину пользователя
server.delete('/api/cart/clear/:userId', (req, res) => {
    const { userId } = req.params;
    const db = router.db.getState();
    
    const initialLength = db.cart.length;
    db.cart = db.cart.filter(item => item.userId != userId);
    
    router.db.setState(db);
    
    res.json({ 
        success: true,
        message: 'Корзина очищена',
        removed: initialLength - db.cart.length
    });
});

// ==================== ТАБЛИЦА 3.7 - PRODUCTS (через JSON Server) ====================
// GET /products - уже предоставляется json-server
// GET /products/:id - уже предоставляется json-server
// GET /products?category=hair - уже предоставляется json-server
// POST /products - уже предоставляется json-server

// ==================== ТАБЛИЦА 3.8 - USERS (частично через JSON Server) ====================
// GET /users - уже предоставляется (но мы отфильтруем пароли)
// PUT /users/:id - уже предоставляется json-server

// Middleware для фильтрации паролей при GET /users
server.get('/users', (req, res, next) => {
  const originalSend = res.json;
  res.json = function(data) {
    if (Array.isArray(data)) {
      data = data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }
    originalSend.call(this, data);
  };
  next();
});

// ==================== ТАБЛИЦА 3.9 - CART (через JSON Server) ====================
// GET /cart - уже предоставляется json-server
// POST /cart - уже предоставляется json-server
// PATCH /cart/:id - уже предоставляется json-server
// DELETE /cart/:id - уже предоставляется json-server

// ==================== ДОКУМЕНТАЦИЯ API ====================

server.get('/api-docs', (req, res) => {
  const db = router.db.getState();
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Everist API Documentation</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
             max-width: 1200px; margin: 0 auto; padding: 20px; 
             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      h1 { color: #1a5d4f; text-align: center; margin-bottom: 30px; }
      h2 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
      .endpoint { background: #f7fafc; border-left: 4px solid #4299e1; 
                  padding: 15px; margin: 15px 0; border-radius: 5px; }
      .method { display: inline-block; padding: 5px 12px; border-radius: 4px; 
                font-weight: bold; margin-right: 10px; color: white; }
      .get { background: #4299e1; }
      .post { background: #48bb78; }
      .put { background: #ed8936; }
      .patch { background: #38b2ac; }
      .delete { background: #f56565; }
      code { background: #edf2f7; padding: 2px 6px; border-radius: 3px; 
             font-family: 'Courier New', monospace; }
      pre { background: #2d3748; color: #e2e8f0; padding: 15px; 
            border-radius: 5px; overflow-x: auto; }
      .stats { display: grid; grid-template-columns: repeat(4, 1fr); 
               gap: 15px; margin: 20px 0; }
      .stat-box { background: #4299e1; color: white; padding: 15px; 
                  border-radius: 8px; text-align: center; }
      .stat-number { font-size: 24px; font-weight: bold; }
      .stat-label { font-size: 14px; opacity: 0.9; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>📚 Everist API Documentation</h1>
      
      <div class="stats">
        <div class="stat-box">
          <div class="stat-number">${db.users.length}</div>
          <div class="stat-label">Пользователей</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${db.products.length}</div>
          <div class="stat-label">Товаров</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${db.orders.length}</div>
          <div class="stat-label">Заказов</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${db.cart.length}</div>
          <div class="stat-label">В корзине</div>
        </div>
      </div>
      
      <h2>📋 Таблица 3.7 – Запросы к объекту «products»</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/products</code>
        <p>Получение списка всех товаров</p>
        <p><strong>Пример:</strong> <code>http://localhost:${PORT}/products</code></p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/products/:id</code>
        <p>Получение товара по ID</p>
        <p><strong>Пример:</strong> <code>http://localhost:${PORT}/products/1</code></p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/products?category=hair</code>
        <p>Получение товаров определенной категории</p>
        <p><strong>Пример:</strong> <code>http://localhost:${PORT}/products?category=hair</code></p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/products</code>
        <p>Добавление нового товара</p>
        <pre>{
  "name": "New Product",
  "price": 35.00,
  "category": "hair",
  "description": "Описание товара",
  "image": "https://example.com/image.jpg"
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/products/search?q=шампунь</code>
        <p>Поиск товаров по названию или описанию</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/products/popular?limit=5</code>
        <p>Получение популярных товаров</p>
      </div>
      
      <h2>👥 Таблица 3.8 – Запросы к объекту «users»</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/users</code>
        <p>Получение списка всех пользователей (без паролей)</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/users/register</code>
        <p>Регистрация нового пользователя</p>
        <pre>{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Новый Пользователь",
  "phone": "+7 (999) 000-00-00"
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method put">PUT</span> <code>/users/:id</code>
        <p>Обновление данных пользователя</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/auth/login</code>
        <p>Аутентификация пользователя</p>
        <pre>{
  "email": "user1@example.com",
  "password": "password123"
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/users/check-email/:email</code>
        <p>Проверка существования email</p>
        <p><strong>Пример:</strong> <code>http://localhost:${PORT}/users/check-email/user1@example.com</code></p>
      </div>
      
      <h2>🛒 Таблица 3.9 – Запросы к объекту «cart»</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/cart</code>
        <p>Получение списка всей корзины</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/cart</code>
        <p>Добавление товара в корзину</p>
        <pre>{
  "userId": 1,
  "productId": 15,
  "quantity": 1
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method patch">PATCH</span> <code>/cart/:id</code>
        <p>Обновление количества товара</p>
        <pre>{
  "quantity": 3
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method delete">DELETE</span> <code>/cart/:id</code>
        <p>Удаление товара из корзины</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/cart/user/:userId</code>
        <p>Получение корзины конкретного пользователя</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/cart/update</code>
        <p>Умное обновление корзины (добавление/обновление/удаление)</p>
        <pre>{
  "userId": 1,
  "productId": 15,
  "quantity": 2
}</pre>
      </div>
      
      <h2>📦 Дополнительные API эндпоинты</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/orders/create-from-cart</code>
        <p>Создание заказа из корзины</p>
        <pre>{
  "userId": 1,
  "deliveryAddress": "ул. Пушкина, д. 10",
  "paymentMethod": "card"
}</pre>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/orders/user/:userId</code>
        <p>Получение заказов пользователя</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/stats</code>
        <p>Получение статистики магазина</p>
      </div>
      
      <hr>
      <h3>⚙️ Примеры использования в JavaScript</h3>
      <pre>
// Получение всех товаров
fetch('http://localhost:${PORT}/products')
  .then(response => response.json())
  .then(data => console.log(data));

// Поиск товаров
fetch('http://localhost:${PORT}/products/search?q=шампунь&category=hair')
  .then(response => response.json())
  .then(data => console.log(data));

// Добавление в корзину
fetch('http://localhost:${PORT}/cart/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    productId: 15,
    quantity: 2
  })
});</pre>
      
      <hr>
      <p><strong>🌐 Базовый URL:</strong> <code>http://localhost:${PORT}</code></p>
      <p><strong>✅ Статус:</strong> Сервер запущен и готов к работе</p>
      <p><strong>📅 Последнее обновление:</strong> ${db.lastUpdate || new Date().toISOString()}</p>
    </div>
  </body>
  </html>
  `;
  
  res.send(html);
});

// ==================== СТАТИЧЕСКИЕ ФАЙЛЫ ====================

// Обслуживаем статические файлы из текущей директории
server.use(express.static(__dirname));

// Для SPA приложения - все остальные маршруты ведут на index.html
server.get('*', (req, res, next) => {
  // Пропускаем API запросы
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/auth') ||
      req.path.startsWith('/products') ||
      req.path.startsWith('/users') ||
      req.path.startsWith('/cart') ||
      req.path.startsWith('/orders') ||
      req.path.startsWith('/stats') ||
      req.path === '/api-docs') {
    return next();
  }
  
  // Возвращаем index.html для SPA
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================

// Инициализируем базу данных
initDatabase();

// Используем стандартный router от json-server
server.use(router);
// Запускаем сервер
server.listen(PORT, () => {
  const db = router.db.getState();
  
  console.log(`=========================================`);
  console.log(`🚀 Everist JSON Server запущен`);
  console.log(`=========================================`);
  console.log(`🌐 Адрес: http://localhost:${PORT}`);
  console.log(`📚 Документация: http://localhost:${PORT}/api-docs`);
  console.log(`\n📊 Статистика базы данных:`);
  console.log(`   👥 Пользователей: ${db.users.length}`);
  console.log(`   🛍️ Товаров: ${db.products.length}`);
  console.log(`   🛒 Элементов в корзине: ${db.cart.length}`);
  console.log(`   📦 Заказов: ${db.orders.length}`);
  console.log(`\n🔧 Доступные API эндпоинты:`);
  console.log(`   GET  /products                    - Все товары`);
  console.log(`   GET  /products/:id               - Товар по ID`);
  console.log(`   GET  /products/search?q=query    - Поиск товаров`);
  console.log(`   POST /auth/login                 - Вход в систему`);
  console.log(`   POST /users/register             - Регистрация`);
  console.log(`   POST /cart/update                - Обновление корзины`);
  console.log(`   POST /orders/create-from-cart    - Создание заказа`);
  console.log(`\n⚠️  Для работы фронтенда откройте index.html`);
  console.log(`=========================================`);
});