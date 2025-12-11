// js/data.js - ПОЛНАЯ ВЕРСИЯ С КОРЗИНОЙ

(function() {
    console.log('🚀 Инициализация DataService для браузера...');
    
    const DataService = {
        isInitialized: false,
        data: null,
        currentUser: null,
        
        // Инициализация
        async init() {
            if (this.isInitialized) {
                return this;
            }
            
            console.log('📡 Инициализация DataService...');
            
            try {
                // Пробуем загрузить данные с сервера
                try {
                    const response = await fetch('/api/get-data');
                    if (response.ok) {
                        this.data = await response.json();
                        console.log('✅ Данные загружены с сервера');
                    } else {
                        throw new Error('Сервер не отвечает');
                    }
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
                console.log(`📊 Данные: ${this.data.users?.length || 0} пользователей, ${this.data.products?.length || 0} товаров`);
                
                // Отправляем событие о готовности
                this.emitReadyEvent();
                
                return this;
                
            } catch (error) {
                console.error('❌ Ошибка инициализации DataService:', error);
                // Даже при ошибке помечаем как инициализированный, чтобы не блокировать
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
        
        // === РЕГИСТРАЦИЯ ===
        async registerUser(userData) {
            try {
                console.log('👤 Регистрация пользователя:', userData.email);
                
                const response = await fetch('/api/register-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Сохраняем пользователя
                    this.currentUser = result.user || {
                        id: result.userId,
                        email: userData.email,
                        name: userData.name || userData.email,
                        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
                        registrationDate: new Date().toISOString().split('T')[0],
                        phone: userData.phone || '',
                        address: userData.address || ''
                    };
                    
                    localStorage.setItem('everist_currentUser', JSON.stringify(this.currentUser));
                    console.log('✅ Пользователь зарегистрирован');
                    
                    // Обновляем локальные данные
                    await this.init();
                }
                
                return result;
            } catch (error) {
                console.error('❌ Ошибка регистрации:', error);
                // Если сервер не отвечает, создаем локального пользователя
                const newUser = {
                    id: Date.now(),
                    email: userData.email,
                    name: userData.name || userData.email,
                    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
                    registrationDate: new Date().toISOString().split('T')[0],
                    phone: userData.phone || '',
                    address: userData.address || '',
                    isLocal: true
                };
                
                this.currentUser = newUser;
                localStorage.setItem('everist_currentUser', JSON.stringify(newUser));
                
                return {
                    success: true,
                    user: newUser,
                    message: 'Регистрация выполнена в локальном режиме'
                };
            }
        },
        
        // === ВХОД ===
        async loginUser(email, password) {
            try {
                console.log('🔐 Попытка входа:', email);
                
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Сохраняем пользователя
                    this.currentUser = result.user;
                    localStorage.setItem('everist_currentUser', JSON.stringify(result.user));
                    console.log('✅ Пользователь вошел:', email);
                    
                    // Обновляем локальные данные
                    await this.init();
                }
                
                return result;
            } catch (error) {
                console.error('❌ Ошибка входа:', error);
                // Проверяем есть ли пользователь в localStorage (для локального режима)
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
                    error: 'Ошибка входа. Проверьте соединение с сервером и попробуйте еще раз.' 
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
            console.log('✅ Пользователь вышел из системы');
        },
        
        // === КОРЗИНА ===
        async addToCart(productId, quantity = 1) {
            try {
                console.log('🛒 Добавление в корзину:', { productId, quantity });
                
                if (!this.currentUser) {
                    throw new Error('Пользователь не авторизован');
                }
                
                const response = await fetch('/api/add-to-cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        productId: productId,
                        quantity: quantity
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Обновляем локальные данные
                    await this.init();
                    console.log('✅ Товар добавлен в корзину');
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Ошибка добавления в корзину:', error);
                
                // Локальное добавление (fallback)
                if (this.currentUser) {
                    const cartItem = {
                        id: Date.now(),
                        userId: this.currentUser.id,
                        productId: productId,
                        quantity: quantity,
                        addedDate: new Date().toISOString().split('T')[0]
                    };
                    
                    this.data.cart.push(cartItem);
                    this.saveLocalCart();
                    
                    console.log('✅ Товар добавлен в локальную корзину');
                    
                    return {
                        success: true,
                        message: 'Товар добавлен в локальную корзину'
                    };
                }
                
                return { 
                    success: false, 
                    error: 'Не удалось добавить товар в корзину' 
                };
            }
        },
        
        async removeFromCart(productId) {
            try {
                console.log('🗑️ Удаление из корзины:', { productId });
                
                if (!this.currentUser) {
                    throw new Error('Пользователь не авторизован');
                }
                
                const response = await fetch('/api/remove-from-cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        productId: productId
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Обновляем локальные данные
                    await this.init();
                    console.log('✅ Товар удален из корзины');
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Ошибка удаления из корзины:', error);
                
                // Локальное удаление (fallback)
                if (this.currentUser) {
                    this.data.cart = this.data.cart.filter(
                        item => !(item.userId === this.currentUser.id && item.productId === productId)
                    );
                    this.saveLocalCart();
                    
                    console.log('✅ Товар удален из локальной корзины');
                    
                    return {
                        success: true,
                        message: 'Товар удален из локальной корзины'
                    };
                }
                
                return { 
                    success: false, 
                    error: 'Не удалось удалить товар из корзины' 
                };
            }
        },
        
        async updateCartItemQuantity(productId, quantity) {
    try {
        console.log('🔄 Обновление количества:', { productId, quantity });
        
        if (!this.currentUser) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Проверяем, есть ли сервер
        let response;
        try {
            response = await fetch('/api/update-cart-quantity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    productId: productId,
                    quantity: quantity
                })
            });
        } catch (fetchError) {
            console.log('🌐 Сервер недоступен, используем локальное хранилище');
            return this.updateCartItemQuantityLocal(productId, quantity);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Обновляем локальные данные
            await this.init();
            console.log('✅ Количество обновлено');
        } else {
            // Если сервер вернул ошибку, пробуем локально
            return this.updateCartItemQuantityLocal(productId, quantity);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка обновления количества:', error);
        // Локальное обновление (fallback)
        return this.updateCartItemQuantityLocal(productId, quantity);
    }
},
        updateCartItemQuantityLocal(productId, quantity) {
    if (!this.currentUser) {
        return { success: false, error: 'Пользователь не авторизован' };
    }
    
    const cartItem = this.data.cart.find(
        item => item.userId === this.currentUser.id && item.productId === productId
    );
    
    if (!cartItem) {
        return { success: false, error: 'Товар не найден в корзине' };
    }
    
    if (quantity <= 0) {
        // Удаляем товар
        this.data.cart = this.data.cart.filter(
            item => !(item.userId === this.currentUser.id && item.productId === productId)
        );
    } else {
        // Обновляем количество
        cartItem.quantity = quantity;
    }
    
    this.saveLocalCart();
    
    console.log('✅ Количество обновлено локально');
    return {
        success: true,
        message: 'Количество обновлено локально'
    };
},
        getCartItems() {
            if (!this.currentUser) return [];
            
            const userCart = (this.data?.cart || []).filter(item => item.userId === this.currentUser.id);
            
            return userCart.map(item => {
                const product = this.getProductById(item.productId);
                return {
                    ...item,
                    product: product || null,
                    totalPrice: product ? product.price * item.quantity : 0
                };
            });
        },
        
        getCartItemCount() {
            if (!this.currentUser) return 0;
            
            const userCart = (this.data?.cart || []).filter(item => item.userId === this.currentUser.id);
            return userCart.reduce((total, item) => total + (item.quantity || 0), 0);
        },
        
        getCartTotal() {
            const cartItems = this.getCartItems();
            return cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        },
        
        isProductInCart(productId) {
            if (!this.currentUser) return false;
            
            const userCart = (this.data?.cart || []).filter(item => item.userId === this.currentUser.id);
            return userCart.some(item => item.productId === productId);
        },
        
        async createOrder(deliveryAddress, paymentMethod = 'card') {
            try {
                console.log('📦 Создание заказа...');
                
                if (!this.currentUser) {
                    throw new Error('Пользователь не авторизован');
                }
                
                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        deliveryAddress: deliveryAddress,
                        paymentMethod: paymentMethod
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Обновляем локальные данные
                    await this.init();
                    console.log('✅ Заказ создан:', result.orderId);
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Ошибка создания заказа:', error);
                return { 
                    success: false, 
                    error: 'Не удалось создать заказ' 
                };
            }
        },
        
        async clearCart() {
            try {
                console.log('🧹 Очистка корзины...');
                
                if (!this.currentUser) {
                    throw new Error('Пользователь не авторизован');
                }
                
                // Получаем все товары пользователя и удаляем по одному
                const userCartItems = this.data.cart.filter(item => item.userId === this.currentUser.id);
                
                for (const item of userCartItems) {
                    await this.removeFromCart(item.productId);
                }
                
                console.log('✅ Корзина очищена');
                return { success: true, message: 'Корзина очищена' };
                
            } catch (error) {
                console.error('❌ Ошибка очистки корзины:', error);
                return { success: false, error: 'Не удалось очистить корзину' };
            }
        },
        
        updateCartBadge() {
            try {
                const cartBadges = document.querySelectorAll('.cart-badge, .cart-count');
                if (!cartBadges.length || !this.isAuthenticated()) return;
                
                const count = this.getCartItemCount();
                
                cartBadges.forEach(badge => {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'flex' : 'none';
                });
            } catch (error) {
                console.log('⚠️ Не удалось обновить бейдж корзины');
            }
        },
        
        // === ЗАКАЗЫ ===
        getUserOrders() {
            if (!this.currentUser) return [];
            
            return (this.data?.orders || []).filter(order => order.userId === this.currentUser.id);
        },
        
        // === ТОВАРЫ ===
        getAllProducts() {
            return this.data?.products || [];
        },
        
        getProductById(id) {
            return (this.data?.products || []).find(p => p.id === id);
        },
        
        // === ВСПОМОГАТЕЛЬНЫЕ ===
        getCartProducts() {
            return this.getCartItems().filter(item => item.product);
        },
        
        async updateUserProfile(updates) {
            console.log('📝 Обновление профиля:', updates);
            if (this.currentUser) {
                this.currentUser = { ...this.currentUser, ...updates };
                localStorage.setItem('everist_currentUser', JSON.stringify(this.currentUser));
                return this.currentUser;
            }
            throw new Error('Пользователь не авторизован');
        },
        
        // Локальное сохранение корзины
        saveLocalCart() {
            try {
                localStorage.setItem('everist_cart_data', JSON.stringify(this.data.cart));
            } catch (error) {
                console.error('❌ Ошибка сохранения локальной корзины:', error);
            }
        },
        
        // Событие о готовности
        emitReadyEvent() {
            const event = new CustomEvent('dataServiceReady', {
                detail: {
                    success: true,
                    service: this
                }
            });
            
            window.dispatchEvent(event);
            console.log('📢 Событие dataServiceReady отправлено');
        },
        
        // Быстрая инициализация без ожидания сервера
        async quickInit() {
            try {
                // Восстанавливаем пользователя из localStorage сразу
                this.restoreUserSession();
                
                // Помечаем как инициализированный чтобы не блокировать
                this.isInitialized = true;
                
                // Загружаем данные из localStorage или создаем пустые
                const savedData = localStorage.getItem('everist_cart_data');
                if (savedData) {
                    this.data = {
                        ...this.data,
                        cart: JSON.parse(savedData)
                    };
                } else {
                    this.data = this.data || {
                        users: [],
                        products: [],
                        cart: [],
                        orders: [],
                        lastUpdate: new Date().toISOString()
                    };
                }
                
                this.emitReadyEvent();
                return this;
            } catch (error) {
                console.error('❌ Ошибка быстрой инициализации:', error);
                throw error;
            }
        }
    };
    
    // Делаем глобальным
    window.dataService = DataService;
    
    // Автоматическая инициализация
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Быстрая инициализация чтобы не блокировать страницы
            await DataService.quickInit();
            console.log('✅ DataService быстро инициализирован');
            
            // Обновляем бейдж корзины
            setTimeout(() => {
                DataService.updateCartBadge();
            }, 100);
            
            // Параллельно делаем полную инициализацию
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
            // Все равно помечаем как готовый чтобы страницы загружались
            DataService.isInitialized = true;
            DataService.emitReadyEvent();
        }
    });
    
})();

// Добавляем метод isReady для совместимости со старым кодом
if (window.dataService && !window.dataService.isReady) {
    window.dataService.isReady = function() {
        return this.isInitialized;
    };
}