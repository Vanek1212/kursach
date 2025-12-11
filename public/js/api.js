// js/api.js - Класс для работы с JSON Server API

class JSONServerAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = localStorage.getItem('token');
        console.log('🚀 JSONServerAPI инициализирован:', this.baseURL);
    }

    // ===== ОБЩИЕ МЕТОДЫ =====

    // Универсальный метод для HTTP запросов
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Настраиваем заголовки
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Добавляем токен авторизации если есть
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            console.log(`📡 API запрос: ${url}`, { method: options.method || 'GET' });
            
            const response = await fetch(url, {
                headers,
                ...options
            });

            // Логируем ответ для отладки
            console.log(`📡 API ответ: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Не удалось распарсить JSON
                }
                throw new Error(errorMessage);
            }

            // Для пустых ответов (DELETE, некоторые POST)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API ошибка (${endpoint}):`, error);
            throw error;
        }
    }

    // Обновление токена авторизации
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
        console.log('🔑 Токен установлен:', token ? 'да' : 'нет');
    }

    // Удаление токена
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        console.log('🔑 Токен удален');
    }

    // ===== ПОЛЬЗОВАТЕЛИ =====

    // Аутентификация
    async login(email, password) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success && response.token) {
                this.setToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            throw new Error(`Ошибка входа: ${error.message}`);
        }
    }

    // Регистрация
    async register(userData) {
        try {
            // Сначала проверяем email
            const emailCheck = await this.checkEmail(userData.email);
            if (emailCheck.exists) {
                throw new Error('Пользователь с таким email уже существует');
            }

            const response = await this.request('/users/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            return response;
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            throw new Error(`Ошибка регистрации: ${error.message}`);
        }
    }

    // Проверка email
    async checkEmail(email) {
        try {
            return await this.request(`/users/check-email/${encodeURIComponent(email)}`);
        } catch (error) {
            console.error('❌ Ошибка проверки email:', error);
            return { exists: false };
        }
    }

    // Получение всех пользователей
    async getUsers() {
        try {
            return await this.request('/users');
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователей:', error);
            return [];
        }
    }

    // Получение пользователя по ID
    async getUser(id) {
        try {
            return await this.request(`/users/${id}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки пользователя ${id}:`, error);
            return null;
        }
    }

    // Обновление пользователя
    async updateUser(id, userData) {
        try {
            return await this.request(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            console.error(`❌ Ошибка обновления пользователя ${id}:`, error);
            throw error;
        }
    }

    // Удаление пользователя
    async deleteUser(id) {
        try {
            return await this.request(`/users/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error(`❌ Ошибка удаления пользователя ${id}:`, error);
            throw error;
        }
    }

    // ===== ТОВАРЫ =====

    // Получение всех товаров
    async getProducts() {
        try {
            return await this.request('/products');
        } catch (error) {
            console.error('❌ Ошибка загрузки товаров:', error);
            return [];
        }
    }

    // Получение товара по ID
    async getProduct(id) {
        try {
            return await this.request(`/products/${id}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки товара ${id}:`, error);
            return null;
        }
    }

    // Создание товара
    async createProduct(productData) {
        try {
            return await this.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        } catch (error) {
            console.error('❌ Ошибка создания товара:', error);
            throw error;
        }
    }

    // Обновление товара
    async updateProduct(id, productData) {
        try {
            return await this.request(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        } catch (error) {
            console.error(`❌ Ошибка обновления товара ${id}:`, error);
            throw error;
        }
    }

    // Удаление товара
    async deleteProduct(id) {
        try {
            return await this.request(`/products/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error(`❌ Ошибка удаления товара ${id}:`, error);
            throw error;
        }
    }

    // Поиск товаров
    async searchProducts(query, category = null) {
        try {
            let url = `/products/search?q=${encodeURIComponent(query)}`;
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            return await this.request(url);
        } catch (error) {
            console.error('❌ Ошибка поиска товаров:', error);
            return [];
        }
    }

    // Популярные товары
    async getPopularProducts(limit = 5) {
        try {
            return await this.request(`/products/popular?limit=${limit}`);
        } catch (error) {
            console.error('❌ Ошибка загрузки популярных товаров:', error);
            return [];
        }
    }

    // Товары по категории
    async getProductsByCategory(category) {
        try {
            return await this.request(`/products?category=${encodeURIComponent(category)}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки товаров категории ${category}:`, error);
            return [];
        }
    }

    // ===== КОРЗИНА =====

    // Получение корзины пользователя
    async getCart(userId) {
        try {
            return await this.request(`/cart/user/${userId}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки корзины пользователя ${userId}:`, error);
            return [];
        }
    }

    // Умное обновление корзины
    async updateCart(userId, productId, quantity) {
        try {
            return await this.request('/cart/update', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    productId,
                    quantity
                })
            });
        } catch (error) {
            console.error('❌ Ошибка обновления корзины:', error);
            throw error;
        }
    }

    // Добавление товара в корзину
    async addToCart(cartItem) {
        try {
            return await this.request('/cart', {
                method: 'POST',
                body: JSON.stringify(cartItem)
            });
        } catch (error) {
            console.error('❌ Ошибка добавления в корзину:', error);
            throw error;
        }
    }

    // Обновление элемента корзины
    async updateCartItem(cartId, updates) {
        try {
            return await this.request(`/cart/${cartId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error(`❌ Ошибка обновления элемента корзины ${cartId}:`, error);
            throw error;
        }
    }

    // Удаление элемента корзины
    async removeCartItem(cartId) {
        try {
            return await this.request(`/cart/${cartId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error(`❌ Ошибка удаления элемента корзины ${cartId}:`, error);
            throw error;
        }
    }

    // Получение всей корзины (админ)
    async getAllCart() {
        try {
            return await this.request('/cart');
        } catch (error) {
            console.error('❌ Ошибка загрузки всей корзины:', error);
            return [];
        }
    }

    // ===== ЗАКАЗЫ =====

    // Создание заказа из корзины
    async createOrderFromCart(orderData) {
        try {
            return await this.request('/orders/create-from-cart', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        } catch (error) {
            console.error('❌ Ошибка создания заказа:', error);
            throw error;
        }
    }

    // Получение заказов пользователя
    async getUserOrders(userId) {
        try {
            return await this.request(`/orders/user/${userId}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки заказов пользователя ${userId}:`, error);
            return [];
        }
    }

    // Получение всех заказов (админ)
    async getAllOrders() {
        try {
            return await this.request('/orders');
        } catch (error) {
            console.error('❌ Ошибка загрузки всех заказов:', error);
            return [];
        }
    }

    // Получение заказа по ID
    async getOrder(id) {
        try {
            return await this.request(`/orders/${id}`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки заказа ${id}:`, error);
            return null;
        }
    }

    // Обновление статуса заказа
    async updateOrderStatus(id, status) {
        try {
            return await this.request(`/orders/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error(`❌ Ошибка обновления заказа ${id}:`, error);
            throw error;
        }
    }

    // ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====

    // Статистика магазина
    async getStats() {
        try {
            return await this.request('/stats');
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
            return {
                totalUsers: 0,
                totalProducts: 0,
                totalOrders: 0,
                totalCartItems: 0,
                lastUpdate: new Date().toISOString()
            };
        }
    }

    // Проверка подключения к серверу
    async checkConnection() {
        try {
            const startTime = Date.now();
            await this.request('/products?_limit=1');
            const responseTime = Date.now() - startTime;
            
            return {
                connected: true,
                responseTime: `${responseTime}ms`,
                url: this.baseURL,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                url: this.baseURL,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Получение всей базы данных (для отладки)
    async getDatabaseSnapshot() {
        try {
            const [products, users, cart, orders] = await Promise.all([
                this.getProducts(),
                this.getUsers(),
                this.getAllCart(),
                this.getAllOrders()
            ]);

            return {
                timestamp: new Date().toISOString(),
                products: {
                    count: products.length,
                    items: products.slice(0, 3) // только первые 3 для примера
                },
                users: {
                    count: users.length,
                    items: users.slice(0, 3)
                },
                cart: {
                    count: cart.length,
                    items: cart.slice(0, 3)
                },
                orders: {
                    count: orders.length,
                    items: orders.slice(0, 3)
                }
            };
        } catch (error) {
            console.error('❌ Ошибка получения снимка БД:', error);
            throw error;
        }
    }

    // ===== УСТАРЕВШИЕ МЕТОДЫ (для обратной совместимости) =====

    // Сохранение данных на сервере (для обратной совместимости)
    async saveData(data) {
        console.warn('⚠️ saveData() устарел. Используйте конкретные методы API');
        
        try {
            // Пытаемся определить тип данных
            if (data.products) {
                // Сохранение продуктов
                const results = await Promise.all(
                    data.products.map(product => this.createProduct(product))
                );
                return { success: true, saved: results.length };
            }
            
            throw new Error('Неизвестный формат данных');
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
            throw error;
        }
    }

    // Загрузка данных с сервера (для обратной совместимости)
    async loadData() {
        console.warn('⚠️ loadData() устарел. Используйте конкретные методы API');
        
        try {
            const [products, users, cart, orders] = await Promise.all([
                this.getProducts(),
                this.getUsers(),
                this.getAllCart(),
                this.getAllOrders()
            ]);

            return {
                products,
                users,
                cart,
                orders,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            throw error;
        }
    }

    // ===== УТИЛИТЫ =====

    // Экспорт данных (для резервного копирования)
    async exportData() {
        try {
            const data = await this.loadData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            return {
                url,
                filename: `everist-backup-${new Date().toISOString().split('T')[0]}.json`,
                dataSize: JSON.stringify(data).length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Ошибка экспорта данных:', error);
            throw error;
        }
    }

    // Импорт данных
    async importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            const results = {
                products: 0,
                users: 0,
                cart: 0,
                orders: 0,
                errors: []
            };

            // Импорт продуктов
            if (data.products && Array.isArray(data.products)) {
                for (const product of data.products) {
                    try {
                        await this.createProduct(product);
                        results.products++;
                    } catch (error) {
                        results.errors.push(`Продукт ${product.id || product.name}: ${error.message}`);
                    }
                }
            }

            // Импорт пользователей
            if (data.users && Array.isArray(data.users)) {
                for (const user of data.users) {
                    try {
                        await this.register(user);
                        results.users++;
                    } catch (error) {
                        results.errors.push(`Пользователь ${user.email}: ${error.message}`);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('❌ Ошибка импорта данных:', error);
            throw error;
        }
    }
}

// ===== ГЛОБАЛЬНЫЙ ЭКСПОРТ =====

// Создаем глобальный экземпляр API
window.JSONServerAPI = JSONServerAPI;

// Удобный синглтон для использования
window.api = new JSONServerAPI();

console.log('✅ JSONServerAPI загружен и готов к работе');
console.log('🌐 API доступен через window.api или new JSONServerAPI()');

// Примеры использования:
/*
// 1. Получение всех товаров
const products = await api.getProducts();

// 2. Вход пользователя
const loginResult = await api.login('email@example.com', 'password');

// 3. Добавление в корзину
await api.updateCart(1, 15, 2); // userId=1, productId=15, quantity=2

// 4. Создание заказа
const order = await api.createOrderFromCart({
    userId: 1,
    deliveryAddress: 'ул. Пушкина, д. 10',
    paymentMethod: 'card'
});

// 5. Проверка соединения
const connection = await api.checkConnection();
console.log('Подключение:', connection);
*/