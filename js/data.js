// js/data.js

class DataService {
    constructor() {
        this.data = null;
        this.users = [];
        this.products = [];
        this.cart = [];
        this.orders = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        
        // Путь к JSON файлу
        this.jsonFilePath = '../data/data.json';
        
        this.eventListeners = {
            'userRegistered': [],
            'userLoggedIn': [],
            'userLoggedOut': [],
            'cartUpdated': [],
            'orderCreated': []
        };
    }

    async initialize() {
        if (this.isInitialized) {
            return Promise.resolve(this);
        }
        
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        console.log('🚀 Инициализация DataService...');
        
        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                // Загружаем данные из JSON файла
                await this.loadDataFromJson();
                
                // Загружаем данные из localStorage (если есть)
                this.loadFromLocalStorage();
                
                // Восстанавливаем сессию
                this.restoreUserSession();
                
                this.isInitialized = true;
                
                console.log('✅ DataService успешно инициализирован');
                console.log('📊 Загруженные данные:');
                console.log(`   👥 Пользователей: ${this.users.length}`);
                console.log(`   🛍️ Товаров: ${this.products.length}`);
                console.log(`   🛒 Записей в корзине: ${this.cart.length}`);
                console.log(`   📦 Заказов: ${this.orders.length}`);
                
                this.emitReadyEvent();
                resolve(this);
                
            } catch (error) {
                console.error('❌ Ошибка инициализации DataService:', error);
                this.isInitialized = true;
                resolve(this);
            }
        });
        
        return this.initializationPromise;
    }

    // Загрузка данных из JSON файла
    async loadDataFromJson() {
        console.log('📥 Загрузка данных из JSON файла...');
        
        try {
            const response = await fetch(this.jsonFilePath);
            
            if (!response.ok) {
                throw new Error(`Не удалось загрузить JSON файл: ${response.status}`);
            }
            
            const jsonData = await response.json();
            console.log('✅ Данные успешно загружены из JSON файла');
            
            // Сохраняем все данные из файла
            this.users = jsonData.users || [];
            this.products = jsonData.products || [];
            this.cart = jsonData.cart || [];
            this.orders = jsonData.orders || [];
            this.data = jsonData;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки JSON файла:', error);
            throw new Error('Не удалось загрузить данные. Проверьте путь к файлу data.json');
        }
    }

    // Сохранение всех данных в JSON файл через серверный API
    // Сохранение всех данных в JSON файл через серверный API
async saveDataToServer() {
    console.log('💾 Сохранение данных на сервере...');
    
    try {
        const dataToSave = {
            users: this.users,
            products: this.products,
            cart: this.cart,
            orders: this.orders,
            lastUpdate: new Date().toISOString()
        };
        
        // Отправляем данные на сервер для сохранения
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Данные успешно сохранены на сервере:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения на сервере:', error);
        
        // Если сервер недоступен, используем fallback - скачиваем файл
        console.log('⚠️ Сервер недоступен, используем скачивание файла...');
        await this.saveDataFallback();
        return { success: false, fallback: true, message: 'Данные сохранены в файл для скачивания' };
    }
}

    // Fallback метод для скачивания файла (если сервер недоступен)
    async saveDataFallback() {
        const dataToSave = {
            users: this.users,
            products: this.products,
            cart: this.cart,
            orders: this.orders,
            lastUpdate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(dataToSave, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Создаем временную ссылку для скачивания
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = 'data_updated.json';
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Освобождаем память
        setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);
        
        console.log('⚠️ Файл data_updated.json готов для скачивания');
    }

    // ===== РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ =====
    async registerUser(email, password, fullName, phone, additionalData = {}) {
        console.log('📝 Регистрация нового пользователя...');
        
        // Валидация
        if (!this.isValidEmail(email)) {
            throw new Error('Введите корректный email');
        }
        
        if (this.isEmailRegistered(email)) {
            throw new Error('Пользователь с таким email уже существует');
        }
        
        if (additionalData.username && this.isUsernameTaken(additionalData.username)) {
            throw new Error('Пользователь с таким никнеймом уже существует');
        }
        
        // Создаем ID для нового пользователя
        const newUserId = this.users.length > 0 
            ? Math.max(...this.users.map(u => u.id)) + 1 
            : 1;
        
        // Создаем нового пользователя
        const newUser = {
            id: newUserId,
            email: email.toLowerCase().trim(),
            password: password,
            name: fullName.trim(),
            avatar: `https://i.pravatar.cc/150?img=${this.users.length + 1}`,
            phone: phone ? phone.trim() : '',
            address: additionalData.address || '',
            registrationDate: new Date().toISOString().split('T')[0],
            username: additionalData.username || '',
            birthDate: additionalData.birthDate || '',
            acceptedTerms: additionalData.acceptedTerms || false,
            isActive: true
        };
        
        console.log('👤 Создан новый пользователь:', newUser.email);
        
        // Добавляем пользователя в массив
        this.users.push(newUser);
        
        // Сохраняем все данные на сервере
        const saveResult = await this.saveDataToServer();
        
        // Автоматически логиним пользователя
        return this.loginUser(email, password);
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isEmailRegistered(email) {
        return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    isUsernameTaken(username) {
        return this.users.some(user => user.username && user.username.toLowerCase() === username.toLowerCase());
    }

    loginUser(email, password) {
        console.log(`🔐 Вход пользователя: ${email}`);
        
        const user = this.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );
        
        if (!user) {
            throw new Error('Неверный email или пароль');
        }
        
        // Сохраняем сессию
        this.currentUser = { ...user };
        delete this.currentUser.password;
        
        const sessionData = {
            userId: user.id,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 дней
        };
        
        localStorage.setItem('everist_session', JSON.stringify(sessionData));
        
        console.log(`✅ Пользователь авторизован: ${user.email}`);
        
        this.emitEvent('userLoggedIn', { user: this.currentUser });
        
        return {
            success: true,
            user: this.currentUser,
            message: 'Вход выполнен успешно'
        };
    }

    logoutUser() {
        console.log(`👋 Выход пользователя: ${this.currentUser?.email || 'неизвестен'}`);
        
        this.currentUser = null;
        localStorage.removeItem('everist_session');
        
        this.emitEvent('userLoggedOut', {});
        
        console.log('✅ Пользователь вышел из системы');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    restoreUserSession() {
        try {
            const sessionData = localStorage.getItem('everist_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.expires > Date.now()) {
                    const user = this.users.find(u => u.id === session.userId);
                    if (user) {
                        this.currentUser = { ...user };
                        delete this.currentUser.password;
                        return true;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ошибка восстановления сессии:', error);
        }
        return false;
    }

    // ===== РАБОТА С ТОВАРАМИ =====
    getAllProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    getProductsByCategory(category) {
        return this.products.filter(p => p.category === category);
    }

    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        );
    }

    // ===== РАБОТА С КОРЗИНОЙ =====
    getCartItems(userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) return [];
        
        const userCart = this.cart.filter(item => item.userId === userId);
        
        return userCart.map(item => {
            const product = this.getProductById(item.productId);
            return {
                ...item,
                product: product || null,
                totalPrice: product ? product.price * item.quantity : 0
            };
        });
    }

    async addToCart(productId, quantity = 1, userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`➕ Добавление в корзину: пользователь ${userId}, товар ${productId}`);
        
        const product = this.getProductById(productId);
        if (!product) {
            throw new Error('Товар не найден');
        }
        
        const existingItem = this.cart.find(
            item => item.userId === userId && item.productId === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const newCartItem = {
                id: this.cart.length > 0 ? Math.max(...this.cart.map(c => c.id)) + 1 : 1,
                userId,
                productId,
                quantity,
                addedDate: new Date().toISOString().split('T')[0]
            };
            this.cart.push(newCartItem);
        }

        // Сохраняем изменения на сервере
        await this.saveDataToServer();
        
        this.updateCartBadge();
        
        console.log(`✅ Товар добавлен в корзину`);
        
        this.emitEvent('cartUpdated', { 
            userId, 
            cart: this.getCartItems(userId) 
        });
        
        return this.getCartItems(userId);
    }

    async updateCartItemQuantity(productId, quantity, userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`🔄 Обновление корзины: товар ${productId}, количество ${quantity}`);
        
        const cartItem = this.cart.find(
            item => item.userId === userId && item.productId === productId
        );

        if (!cartItem) {
            throw new Error('Товар не найден в корзине');
        }

        if (quantity <= 0) {
            this.cart = this.cart.filter(
                item => !(item.userId === userId && item.productId === productId)
            );
        } else {
            cartItem.quantity = quantity;
        }

        // Сохраняем изменения на сервере
        await this.saveDataToServer();
        
        this.updateCartBadge();
        
        console.log(`✅ Корзина обновлена`);
        
        this.emitEvent('cartUpdated', { 
            userId, 
            cart: this.getCartItems(userId) 
        });
        
        return this.getCartItems(userId);
    }

    async removeFromCart(productId, userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`🗑️ Удаление из корзины: товар ${productId}`);
        
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(
            item => !(item.userId === userId && item.productId === productId)
        );

        if (this.cart.length < initialLength) {
            // Сохраняем изменения на сервере
            await this.saveDataToServer();
            
            this.updateCartBadge();
            console.log(`✅ Товар удален из корзины`);
            
            this.emitEvent('cartUpdated', { 
                userId, 
                cart: this.getCartItems(userId) 
            });
        }
        
        return this.getCartItems(userId);
    }

    async clearCart(userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`🧹 Очистка корзины пользователя: ${userId}`);
        
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.userId !== userId);
        
        if (this.cart.length < initialLength) {
            // Сохраняем изменения на сервере
            await this.saveDataToServer();
            
            this.updateCartBadge();
            console.log(`✅ Корзина очищена`);
            
            this.emitEvent('cartUpdated', { userId, cart: [] });
        }
        
        return this.getCartItems(userId);
    }

    getCartTotal(userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) return 0;
        
        const cartItems = this.getCartItems(userId);
        return cartItems.reduce((sum, item) => {
            return sum + (item.product ? item.product.price * item.quantity : 0);
        }, 0);
    }

    getCartItemCount(userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) return 0;
        
        const userCart = this.cart.filter(item => item.userId === userId);
        return userCart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartBadge() {
        if (!this.currentUser) {
            return;
        }

        const count = this.getCartItemCount(this.currentUser.id);
        const badges = document.querySelectorAll('.cart-badge');
        
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        });
    }

    // ===== РАБОТА С ЗАКАЗАМИ =====
    getUserOrders(userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) return [];
        
        return (this.orders || []).filter(order => order.userId === userId);
    }

    async createOrder(deliveryAddress = '', paymentMethod = 'card', userId = null) {
        if (!userId && this.currentUser) {
            userId = this.currentUser.id;
        }
        
        if (!userId) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`🛒 Создание заказа для пользователя: ${userId}`);
        
        const cartItems = this.getCartItems(userId);
        
        if (cartItems.length === 0) {
            throw new Error('Корзина пуста');
        }

        const total = this.getCartTotal(userId);
        
        const orderId = this.orders.length > 0 
            ? Math.max(...this.orders.map(o => o.id)) + 1 
            : 1;
        
        const order = {
            id: orderId,
            userId,
            products: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            total: parseFloat(total.toFixed(2)),
            status: 'completed',
            orderDate: new Date().toISOString().split('T')[0],
            deliveryAddress: deliveryAddress || this.currentUser?.address || ''
        };

        this.orders.push(order);
        
        // Очищаем корзину
        await this.clearCart(userId);
        
        // Сохраняем изменения на сервере
        await this.saveDataToServer();
        
        console.log(`✅ Заказ создан: ID ${order.id}, сумма: $${total.toFixed(2)}`);
        
        this.emitEvent('orderCreated', { order });
        
        return order;
    }

    // ===== СОБЫТИЯ =====
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                cb => cb !== callback
            );
        }
    }

    emitEvent(eventName, data) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Ошибка в обработчике события ${eventName}:`, error);
                }
            });
        }
    }

    emitReadyEvent() {
        const event = new CustomEvent('dataServiceReady', {
            detail: {
                success: true,
                service: this
            }
        });
        
        window.dispatchEvent(event);
        
        console.log('📢 Событие dataServiceReady отправлено');
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    isReady() {
        return this.isInitialized;
    }

    getAllData() {
        return {
            users: this.users,
            products: this.products,
            cart: this.cart,
            orders: this.orders
        };
    }

    // Обновление профиля пользователя
    async updateUserProfile(updates) {
        if (!this.currentUser) {
            throw new Error('Требуется авторизация');
        }
        
        console.log(`📝 Обновление профиля пользователя: ${this.currentUser.email}`);
        
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }
        
        // Обновляем данные
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        
        // Обновляем текущего пользователя
        this.currentUser = { ...this.currentUser, ...updates };
        
        // Сохраняем изменения на сервере
        await this.saveDataToServer();
        
        console.log(`✅ Профиль обновлен`);
        
        return this.currentUser;
    }

    // Загрузка из localStorage
    loadFromLocalStorage() {
        try {
            const savedSession = localStorage.getItem('everist_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                if (session.expires > Date.now()) {
                    const user = this.users.find(u => u.id === session.userId);
                    if (user && user.isActive !== false) {
                        this.currentUser = { ...user };
                        delete this.currentUser.password;
                        console.log(`🔑 Сессия восстановлена: ${user.email}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
    }
}

// Создаем глобальный экземпляр
window.dataService = new DataService();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM загружен, начинаем инициализацию DataService...');
    
    try {
        await window.dataService.initialize();
        console.log('✅ DataService готов к использованию');
        
        // Обновляем бейдж корзины
        if (window.dataService.isAuthenticated()) {
            window.dataService.updateCartBadge();
        }
        
    } catch (error) {
        console.error('❌ Ошибка инициализации DataService:', error);
    }
});

// Для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}