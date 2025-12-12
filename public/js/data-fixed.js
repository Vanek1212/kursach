// js/data-fixed.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ JSON SERVER

(function() {
    console.log('🚀 Инициализация DataService для JSON Server...');
    
    const API_BASE_URL = 'http://localhost:3000';
    
    const DataService = {
        isInitialized: false,
        data: null,
        currentUser: null,
        
        // Универсальная функция для запросов
        async makeRequest(endpoint, options = {}) {
            try {
                console.log(`📡 Запрос: ${endpoint}`, options);
                
                const defaultHeaders = {
                    'Content-Type': 'application/json',
                };
                
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    headers: defaultHeaders,
                    ...options
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`❌ Ошибка запроса (${endpoint}):`, error);
                throw error;
            }
        },
        
        // Инициализация
        async init() {
            if (this.isInitialized) {
                return this;
            }
            
            console.log('📡 Инициализация DataService для JSON Server...');
            
            try {
                // Пробуем загрузить данные с сервера
                try {
                    // Получаем все товары
                    const products = await this.makeRequest('/products');
                    
                    this.data = {
                        products: products,
                        cart: [],
                        orders: [],
                        users: []
                    };
                    
                    console.log('✅ Данные загружены с JSON Server');
                } catch (error) {
                    console.log('⚠️ Используем локальные данные (режим без сервера)');
                    this.data = {
                        users: [],
                        products: [],
                        cart: [],
                        orders: [],
                        lastUpdate: new Date().toISOString()
                    };
                }
                
                // Восстанавливаем пользователя из localStorage
                this.restoreUserSession();
                
                this.isInitialized = true;
                
                console.log('✅ DataService инициализирован');
                
                // Отправляем событие о готовности
                this.emitReadyEvent();
                
                return this;
                
            } catch (error) {
                console.error('❌ Ошибка инициализации DataService:', error);
                this.isInitialized = true;
                this.data = {
                    users: [],
                    products: [],
                    cart: [],
                    orders: [],
                    lastUpdate: new Date().toISOString()
                };
                this.emitReadyEvent();
                throw error;
            }
        },
        
        // Восстановление сессии
        restoreUserSession() {
            try {
                const savedUser = localStorage.getItem('everist_currentUser');
                if (savedUser) {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('👤 Восстановлен пользователь из localStorage:', this.currentUser?.email);
                    return true;
                }
            } catch (error) {
                console.error('❌ Ошибка восстановления сессии:', error);
            }
            return false;
        },
        
        // === ВХОД через JSON Server ===
        async loginUser(email, password) {
            try {
                console.log('🔐 Попытка входа через JSON Server:', email);
                
                const result = await this.makeRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                if (result.success) {
                    // Сохраняем пользователя
                    this.currentUser = result.user;
                    localStorage.setItem('everist_currentUser', JSON.stringify(result.user));
                    console.log('✅ Пользователь вошел:', email);
                    
                    // Загружаем корзину пользователя
                    await this.loadUserCart(result.user.id);
                    
                    return result;
                } else {
                    return { 
                        success: false, 
                        error: result.error || 'Ошибка входа' 
                    };
                }
                
            } catch (error) {
                console.error('❌ Ошибка входа:', error);
                
                // Fallback: проверяем локальные данные
                const savedUser = localStorage.getItem('everist_currentUser');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    if (user.email === email) {
                        this.currentUser = user;
                        console.log('✅ Пользователь вошел (локальный режим):', email);
                        return {
                            success: true,
                            user: user,
                            message: 'Вход выполнен в локальном режиме'
                        };
                    }
                }
                
                return { 
                    success: false, 
                    error: 'Ошибка входа. Проверьте email и пароль.' 
                };
            }
        },
        
        // Загрузка корзины пользователя
        async loadUserCart(userId) {
            try {
                const cartItems = await this.makeRequest(`/cart/user/${userId}`);
                this.data.cart = cartItems;
                console.log('✅ Корзина загружена:', cartItems.length, 'товаров');
            } catch (error) {
                console.error('❌ Ошибка загрузки корзины:', error);
                this.data.cart = [];
            }
        },
        
        // === РЕГИСТРАЦИЯ ===
        async registerUser(userData) {
            try {
                console.log('👤 Регистрация пользователя:', userData.email);
                
                const result = await this.makeRequest('/users/register', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                
                if (result.success) {
                    this.currentUser = result.user;
                    localStorage.setItem('everist_currentUser', JSON.stringify(result.user));
                    console.log('✅ Пользователь зарегистрирован');
                    
                    return result;
                } else {
                    return { 
                        success: false, 
                        error: result.error || 'Ошибка регистрации' 
                    };
                }
            } catch (error) {
                console.error('❌ Ошибка регистрации:', error);
                return { 
                    success: false, 
                    error: 'Ошибка регистрации. Проверьте соединение.' 
                };
            }
        },
        
        // === ПРОВЕРКИ ===
        isAuthenticated() {
            return !!this.currentUser;
        },
        
        getCurrentUser() {
            return this.currentUser;
        },
        
        logoutUser() {
            console.log(`👋 Выход пользователя: ${this.currentUser?.email || 'неизвестен'}`);
            this.currentUser = null;
            localStorage.removeItem('everist_currentUser');
            this.data.cart = [];
            console.log('✅ Пользователь вышел из системы');
        },
        
        // === КОРЗИНА через JSON Server ===
        async addToCart(productId, quantity = 1) {
            try {
                console.log('🛒 Добавление в корзину:', { productId, quantity });
                
                if (!this.currentUser) {
                    throw new Error('Пользователь не авторизован');
                }
                
                // Используем умное обновление корзины
                const result = await this.makeRequest('/cart/update', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        productId: productId,
                        quantity: quantity
                    })
                });
                
                if (result.success) {
                    // Перезагружаем корзину
                    await this.loadUserCart(this.currentUser.id);
                    console.log('✅ Товар добавлен в корзину');
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Ошибка добавления в корзину:', error);
                return { 
                    success: false, 
                    error: 'Не удалось добавить товар в корзину' 
                };
            }
        },
        
        // Быстрая инициализация
        async quickInit() {
            try {
                this.restoreUserSession();
                this.isInitialized = true;
                this.data = this.data || {
                    users: [],
                    products: [],
                    cart: [],
                    orders: [],
                    lastUpdate: new Date().toISOString()
                };
                
                this.emitReadyEvent();
                return this;
            } catch (error) {
                console.error('❌ Ошибка быстрой инициализации:', error);
                throw error;
            }
        },
        
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
    };
    
    window.dataService = DataService;
    
    // Автоматическая инициализация
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await DataService.quickInit();
            console.log('✅ DataService быстро инициализирован');
            
            // Полная инициализация в фоне
            setTimeout(async () => {
                try {
                    await DataService.init();
                    console.log('✅ DataService полностью инициализирован');
                } catch (error) {
                    console.log('⚠️ Полная инициализация не удалась, но приложение работает');
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации DataService:', error);
            DataService.isInitialized = true;
            DataService.emitReadyEvent();
        }
    });
    
})();