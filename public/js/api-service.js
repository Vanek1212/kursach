// js/api-service.js - Сервис для работы с API
class ApiService {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    // ========== ОБЩИЕ МЕТОДЫ ==========
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
                }
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ Ошибка запроса ${endpoint}:`, error);
            throw error;
        }
    }

    // ========== ТОВАРЫ (Таблица 3.7) ==========

    // 1. Получение списка товаров
    async getProducts(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const endpoint = `/products${query ? `?${query}` : ''}`;
        return this.request(endpoint);
    }

    // 2. Получение товара по ID
    async getProductById(id) {
        return this.request(`/products/${id}`);
    }

    // 3. Добавление нового товара (для админки)
    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    // 4. Обновление товара
    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    // 5. Удаление товара
    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== ПОЛЬЗОВАТЕЛИ (Таблица 3.8) ==========

    // 1. Получение списка всех пользователей
    async getUsers() {
        return this.request('/users');
    }

    // 2. Регистрация нового пользователя
    async register(userData) {
        const result = await this.request('/users', {
            method: 'POST',
            body: JSON.stringify({
                ...userData,
                registrationDate: new Date().toISOString().split('T')[0],
                avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
                isActive: true
            })
        });

        // Автоматически логиним после регистрации
        if (result.id) {
            return this.login(userData.email, userData.password);
        }

        return result;
    }

    // 3. Обновление данных пользователя
    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // 4. Аутентификация пользователя
    async login(email, password) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success) {
            this.token = result.token;
            this.currentUser = result.user;
            
            // Сохраняем в localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            localStorage.setItem('userId', result.userId);
            
            // Обновляем UI
            this.updateAuthUI();
        }

        return result;
    }

    // 5. Выход
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        this.updateAuthUI();
        window.location.href = '/';
    }

    // 6. Проверка email
    async checkEmail(email) {
        return this.request(`/users/check-email/${email}`);
    }

    // ========== КОРЗИНА (Таблица 3.9) ==========

    // 1. Получение списка корзины
    async getCart() {
        if (!this.currentUser) return [];
        return this.request(`/cart/user/${this.currentUser.id}`);
    }

    // 2. Добавление товара в корзину
    async addToCart(productId, quantity = 1) {
        if (!this.currentUser) {
            throw new Error('Необходима авторизация');
        }

        return this.request('/cart', {
            method: 'POST',
            body: JSON.stringify({
                userId: this.currentUser.id,
                productId: productId,
                quantity: quantity,
                addedDate: new Date().toISOString().split('T')[0]
            })
        });
    }

    // 3. Обновление количества товара
    async updateCartItem(itemId, quantity) {
        return this.request(`/cart/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity })
        });
    }

    // 4. Удаление товара из корзины
    async removeFromCart(itemId) {
        return this.request(`/cart/${itemId}`, {
            method: 'DELETE'
        });
    }

    // 5. Умное обновление корзины (через кастомный эндпоинт)
    async updateCart(productId, quantity) {
        if (!this.currentUser) {
            throw new Error('Необходима авторизация');
        }

        return this.request('/cart/update', {
            method: 'POST',
            body: JSON.stringify({
                userId: this.currentUser.id,
                productId: productId,
                quantity: quantity
            })
        });
    }

    // ========== ЗАКАЗЫ ==========

    // 1. Получение заказов пользователя
    async getOrders() {
        if (!this.currentUser) return [];
        return this.request(`/orders/user/${this.currentUser.id}`);
    }

    // 2. Создание заказа из корзины
    async createOrder(deliveryAddress = '', paymentMethod = 'card') {
        if (!this.currentUser) {
            throw new Error('Необходима авторизация');
        }

        return this.request('/orders/create-from-cart', {
            method: 'POST',
            body: JSON.stringify({
                userId: this.currentUser.id,
                deliveryAddress: deliveryAddress,
                paymentMethod: paymentMethod
            })
        });
    }

    // ========== ПОЛЕЗНЫЕ МЕТОДЫ ==========

    // Поиск товаров
    async searchProducts(query, category = '') {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (category) params.append('category', category);
        
        return this.request(`/search/products?${params.toString()}`);
    }

    // Популярные товары
    async getPopularProducts(limit = 5) {
        return this.request(`/products/popular?limit=${limit}`);
    }

    // Статистика
    async getStats() {
        return this.request('/stats');
    }

    // ========== UI МЕТОДЫ ==========

    // Обновление UI в зависимости от авторизации
    updateAuthUI() {
        const authElements = document.querySelectorAll('[data-auth]');
        const userElements = document.querySelectorAll('[data-user]');
        const cartBadge = document.querySelector('.cart-badge');

        authElements.forEach(el => {
            const authType = el.dataset.auth;
            
            if (authType === 'show-if-auth' && this.currentUser) {
                el.style.display = '';
            } else if (authType === 'hide-if-auth' && this.currentUser) {
                el.style.display = 'none';
            } else if (authType === 'show-if-guest' && !this.currentUser) {
                el.style.display = '';
            } else if (authType === 'hide-if-guest' && !this.currentUser) {
                el.style.display = 'none';
            }
        });

        // Обновляем информацию о пользователе
        userElements.forEach(el => {
            const userField = el.dataset.user;
            if (this.currentUser && this.currentUser[userField]) {
                if (el.tagName === 'IMG') {
                    el.src = this.currentUser[userField];
                } else {
                    el.textContent = this.currentUser[userField];
                }
            }
        });

        // Обновляем бейдж корзины
        if (cartBadge) {
            this.updateCartBadge();
        }
    }

    // Обновление бейджа корзины
    async updateCartBadge() {
        const cartBadge = document.querySelector('.cart-badge');
        if (!cartBadge) return;

        try {
            const cart = await this.getCart();
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        } catch (error) {
            console.error('Ошибка обновления бейджа:', error);
        }
    }

    // Проверка авторизации при загрузке
    checkAuth() {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.currentUser = JSON.parse(savedUser);
            this.updateAuthUI();
            return true;
        }
        return false;
    }
}

// Создаем глобальный экземпляр
window.api = new ApiService();