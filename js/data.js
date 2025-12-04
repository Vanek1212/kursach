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
    }

    // Загрузка данных с сервера
    async loadData() {
        console.log('📥 Загрузка данных...');
        
        const possiblePaths = [
            '/data/data.json',
            'data/data.json',
            '/data.json',
            'data.json',
            '../data/data.json',
            '../data.json'
        ];
        
        let loadedData = null;
        let lastError = null;
        
        for (const path of possiblePaths) {
            try {
                console.log(`🔄 Пробуем путь: ${path}`);
                const response = await fetch(path);
                
                if (response.ok) {
                    loadedData = await response.json();
                    console.log(`✅ Данные успешно загружены с пути: ${path}`);
                    break;
                } else {
                    console.log(`❌ Путь ${path}: статус ${response.status}`);
                }
            } catch (error) {
                lastError = error;
                console.log(`❌ Ошибка загрузки с пути ${path}:`, error.message);
            }
        }
        
        if (!loadedData) {
            console.error('❌ Не удалось загрузить данные ни с одного пути');
            
            const localStorageData = this.loadFromLocalStorage();
            if (localStorageData) {
                console.log('🔄 Используем данные из localStorage');
                loadedData = localStorageData;
            } else {
                console.log('🔄 Загружаем демо-данные...');
                this.loadDemoProducts();
                return this.data;
            }
        }
        
        this.data = loadedData;
        this.users = this.data.users || [];
        this.products = this.data.products || [];
        this.cart = this.data.cart || [];
        this.orders = this.data.orders || [];
        
        console.log('✅ Данные успешно загружены:');
        console.log(`   👥 Пользователей: ${this.users.length}`);
        console.log(`   🛍️ Товаров: ${this.products.length}`);
        console.log(`   🛒 Корзины: ${this.cart.length}`);
        console.log(`   📦 Заказов: ${this.orders.length}`);
        
        this.saveToLocalStorage();
        
        return this.data;
    }

    // Загрузка демо-данных
    loadDemoProducts() {
        console.log('🛠️ Создание демо-данных...');
        
        this.products = [
            {
                id: 1,
                name: "Waterless Shampoo Paste",
                price: 24.00,
                oldPrice: 26.00,
                image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
                reviews: 85,
                description: "Безводный шампунь-паста для любых типов волос",
                category: "hair",
                features: ["Без воды", "Веганский", "Без пластика"],
                rating: 4.5
            },
            {
                id: 2,
                name: "Conditioner Concentrate",
                price: 24.00,
                oldPrice: null,
                image: "https://images.unsplash.com/photo-1608248242905-5f2274e7d4d5?w=400",
                reviews: 10,
                description: "Концентрат кондиционера для увлажнения волос",
                category: "hair",
                features: ["Без воды", "Без силиконов", "Без парабенов"],
                rating: 4.2
            },
            {
                id: 3,
                name: "Holiday Kit",
                price: 46.00,
                oldPrice: 48.00,
                image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400",
                reviews: 32,
                description: "Праздничный набор: шампунь + кондиционер",
                category: "kit",
                features: ["Эко-упаковка", "Идеальный подарок", "Комплект"],
                rating: 4.8
            },
            {
                id: 4,
                name: "Body Wash Concentrate",
                price: 22.00,
                oldPrice: 24.00,
                image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400",
                reviews: 45,
                description: "Концентрат для душа с натуральными маслами",
                category: "body",
                features: ["Для тела", "Увлажняющий", "Без SLS"],
                rating: 4.3
            },
            {
                id: 5,
                name: "Face Cleanser Paste",
                price: 28.00,
                oldPrice: 30.00,
                image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400",
                reviews: 67,
                description: "Очищающая паста для лица с глиной",
                category: "face",
                features: ["Для лица", "Очищение пор", "Антибактериальный"],
                rating: 4.6
            },
            {
                id: 6,
                name: "Toothpaste Tablets",
                price: 18.00,
                oldPrice: 20.00,
                image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400",
                reviews: 52,
                description: "Таблетки для чистки зубов без пластиковой упаковки",
                category: "oral",
                features: ["Без пластика", "Эко-упаковка", "Натуральный состав"],
                rating: 4.4
            },
            {
                id: 7,
                name: "Home Cleaning Concentrate",
                price: 20.00,
                oldPrice: 22.00,
                image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400",
                reviews: 38,
                description: "Концентрат для уборки дома с эфирными маслами",
                category: "home",
                features: ["Многоразовый", "Эко-состав", "Экономичный"],
                rating: 4.3
            },
            {
                id: 8,
                name: "Perfume Oil",
                price: 35.00,
                oldPrice: 38.00,
                image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400",
                reviews: 72,
                description: "Концентрированное парфюмерное масло без спирта",
                category: "perfume",
                features: ["Без спирта", "Долгий шлейф", "Натуральные масла"],
                rating: 4.7
            },
            {
                id: 9,
                name: "Complete Care Set",
                price: 85.00,
                oldPrice: 95.00,
                image: "https://images.unsplash.com/photo-1556228579-4ac32ac7a737?w=400",
                reviews: 28,
                description: "Полный набор для ухода за телом и волосами",
                category: "kit",
                features: ["Полный набор", "Экономия 15%", "Идеально для подарка"],
                rating: 4.9
            }
        ];
        
        if (this.users.length === 0) {
            this.users = [
                {
                    id: 1,
                    email: "demo@example.com",
                    password: "demo123",
                    name: "Демо Пользователь",
                    avatar: "https://i.pravatar.cc/150?img=1",
                    phone: "+7 (999) 000-00-00",
                    address: "ул. Примерная, 1",
                    registrationDate: new Date().toISOString().split('T')[0]
                }
            ];
        }
        
        this.cart = [];
        this.orders = [];
        this.data = {
            users: this.users,
            products: this.products,
            cart: this.cart,
            orders: this.orders
        };
        
        console.log('✅ Демо-данные созданы');
        this.saveToLocalStorage();
    }

    // Сохранение в localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('everist_users', JSON.stringify(this.users));
            localStorage.setItem('everist_products', JSON.stringify(this.products));
            localStorage.setItem('everist_cart', JSON.stringify(this.cart));
            localStorage.setItem('everist_orders', JSON.stringify(this.orders));
            
            if (this.currentUser) {
                localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
            }
            
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
        }
    }

    // Загрузка из localStorage
    loadFromLocalStorage() {
        try {
            console.log('📥 Загрузка из localStorage...');
            
            const savedUsers = localStorage.getItem('everist_users');
            const savedProducts = localStorage.getItem('everist_products');
            const savedCart = localStorage.getItem('everist_cart');
            const savedOrders = localStorage.getItem('everist_orders');
            const savedCurrentUser = localStorage.getItem('everist_current_user');

            if (savedProducts) {
                const parsed = JSON.parse(savedProducts);
                if (parsed && parsed.length > 0) {
                    this.products = parsed;
                    console.log(`🛍️ Товары из localStorage: ${this.products.length}`);
                }
            }
            
            if (savedUsers) {
                const parsed = JSON.parse(savedUsers);
                if (parsed && parsed.length > 0) {
                    this.users = parsed;
                }
            }
            
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
            
            if (savedOrders) {
                this.orders = JSON.parse(savedOrders);
            }
            
            if (savedCurrentUser) {
                this.currentUser = JSON.parse(savedCurrentUser);
                console.log(`👤 Текущий пользователь из localStorage: ${this.currentUser.email}`);
            }
            
            return {
                users: this.users,
                products: this.products,
                cart: this.cart,
                orders: this.orders
            };
            
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
            return null;
        }
    }

    // Загрузка текущего пользователя
    loadCurrentUser() {
        try {
            const savedUser = localStorage.getItem('everist_current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                console.log(`👤 Текущий пользователь загружен: ${this.currentUser.email}`);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            this.currentUser = null;
        }
    }

    // ===== ПОЛЬЗОВАТЕЛИ =====
    registerUser(email, password, name, phone = '', address = '') {
        console.log(`📝 Регистрация пользователя: ${email}`);
        
        if (this.isEmailRegistered(email)) {
            throw new Error('Пользователь с таким email уже существует');
        }

        const newUser = {
            id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
            email,
            password,
            name,
            avatar: `https://i.pravatar.cc/150?img=${this.users.length + 1}`,
            phone,
            address,
            registrationDate: new Date().toISOString().split('T')[0]
        };

        this.users.push(newUser);
        this.saveToLocalStorage();
        
        console.log(`✅ Пользователь зарегистрирован: ${email}`);
        
        return newUser;
    }

    loginUser(email, password) {
        console.log(`🔐 Вход пользователя: ${email}`);
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Неверный email или пароль');
        }

        this.currentUser = { ...user };
        localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
        
        console.log(`✅ Пользователь авторизован: ${email}`);
        
        return user;
    }

    logoutUser() {
        console.log(`👋 Выход пользователя: ${this.currentUser?.email || 'неизвестен'}`);
        this.currentUser = null;
        localStorage.removeItem('everist_current_user');
    }

    updateUserProfile(userId, updates) {
        console.log(`📝 Обновление профиля пользователя ID: ${userId}`);
        
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = { ...this.currentUser, ...updates };
            localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
        }
        
        this.saveToLocalStorage();
        console.log(`✅ Профиль пользователя обновлен: ID ${userId}`);
        
        return this.users[userIndex];
    }

    // Проверка, зарегистрирован ли email
    isEmailRegistered(email) {
        return this.users.some(user => user.email === email);
    }

    // Получение пользователя по email
    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    // Проверка авторизации
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // ===== ТОВАРЫ =====
    getAllProducts() {
        console.log(`📊 Получение всех товаров: ${this.products.length}`);
        return this.products;
    }

    getProductById(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) {
            console.warn(`⚠️ Товар с ID ${id} не найден`);
        }
        return product;
    }

    getProductsByCategory(category) {
        return this.products.filter(p => p.category === category);
    }

    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            (p.features || []).some(feature => 
                feature.toLowerCase().includes(lowerQuery)
            )
        );
    }

    // ===== КОРЗИНА =====
    getCartItems(userId) {
        console.log(`🛒 Получение корзины пользователя ID: ${userId}`);
        
        if (!this.cart) return [];
        
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

    // Проверка, есть ли товар в корзине
    isProductInCart(userId, productId) {
        return this.cart.some(item => item.userId === userId && item.productId === productId);
    }

    // Получение элемента корзины
    getCartItem(userId, productId) {
        return this.cart.find(item => item.userId === userId && item.productId === productId);
    }

    addToCart(userId, productId, quantity = 1) {
        console.log(`➕ Добавление в корзину: пользователь ${userId}, товар ${productId}, количество ${quantity}`);
        
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

        this.saveToLocalStorage();
        this.updateCartBadge();
        
        console.log(`✅ Товар добавлен в корзину`);
        
        return this.getCartItems(userId);
    }

    updateCartItemQuantity(userId, productId, quantity) {
        console.log(`🔄 Обновление количества: пользователь ${userId}, товар ${productId}, количество ${quantity}`);
        
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

        this.saveToLocalStorage();
        this.updateCartBadge();
        
        console.log(`✅ Количество товара обновлено`);
        
        return this.getCartItems(userId);
    }

    removeFromCart(userId, productId) {
        console.log(`🗑️ Удаление из корзины: пользователь ${userId}, товар ${productId}`);
        
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(
            item => !(item.userId === userId && item.productId === productId)
        );

        if (this.cart.length < initialLength) {
            this.saveToLocalStorage();
            this.updateCartBadge();
            console.log(`✅ Товар удален из корзины`);
        }
        
        return this.getCartItems(userId);
    }

    clearCart(userId) {
        console.log(`🧹 Очистка корзины пользователя: ${userId}`);
        
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.userId !== userId);
        
        if (this.cart.length < initialLength) {
            this.saveToLocalStorage();
            this.updateCartBadge();
            console.log(`✅ Корзина очищена`);
        }
        
        return this.getCartItems(userId);
    }

    getCartTotal(userId) {
        const cartItems = this.getCartItems(userId);
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.product ? item.product.price * item.quantity : 0);
        }, 0);
        
        console.log(`💰 Общая сумма корзины пользователя ${userId}: $${total.toFixed(2)}`);
        return total;
    }

    getCartItemCount(userId) {
        if (!this.cart) return 0;
        const userCart = this.cart.filter(item => item.userId === userId);
        const count = userCart.reduce((total, item) => total + item.quantity, 0);
        return count;
    }

    // Обновление бейджа корзины
    updateCartBadge() {
        if (!this.currentUser) {
            console.log('⚠️ Нет текущего пользователя для обновления бейджа');
            return;
        }

        const count = this.getCartItemCount(this.currentUser.id);
        const badges = document.querySelectorAll('.cart-badge');
        
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
                console.log(`🔄 Бейдж корзины обновлен: ${count}`);
            }
        });
    }

    // ===== ЗАКАЗЫ =====
    getUserOrders(userId) {
        console.log(`📦 Получение заказов пользователя: ${userId}`);
        return (this.orders || []).filter(order => order.userId === userId);
    }

    createOrder(userId, deliveryAddress = '') {
        console.log(`🛒 Создание заказа для пользователя: ${userId}`);
        
        const cartItems = this.getCartItems(userId);
        
        if (cartItems.length === 0) {
            throw new Error('Корзина пуста');
        }

        const total = this.getCartTotal(userId);
        
        const order = {
            id: this.orders.length > 0 
                ? Math.max(...this.orders.map(o => o.id)) + 1 
                : 1,
            userId,
            products: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            total,
            status: 'pending',
            orderDate: new Date().toISOString().split('T')[0],
            deliveryAddress: deliveryAddress || this.currentUser?.address || ''
        };

        this.orders.push(order);
        this.saveToLocalStorage();
        
        this.clearCart(userId);
        
        console.log(`✅ Заказ создан: ID ${order.id}, сумма: $${total.toFixed(2)}`);
        
        return order;
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
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
                this.loadFromLocalStorage();
                
                await this.loadData();
                
                this.loadCurrentUser();
                
                this.isInitialized = true;
                
                console.log('✅ DataService успешно инициализирован');
                console.log(`📊 Итоговые данные:`);
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

    // Отправка события о готовности
    emitReadyEvent() {
        const event = new CustomEvent('dataServiceReady', {
            detail: {
                success: true,
                productsCount: this.products.length,
                usersCount: this.users.length
            }
        });
        
        window.dispatchEvent(event);
        document.dispatchEvent(new Event('dataServiceReady'));
        
        console.log('📢 Событие dataServiceReady отправлено');
    }

    // Проверка готовности
    isReady() {
        return this.isInitialized;
    }

    // Сброс данных (для тестирования)
    resetData() {
        console.log('⚠️ Сброс всех данных DataService');
        this.users = [];
        this.products = [];
        this.cart = [];
        this.orders = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        localStorage.removeItem('everist_users');
        localStorage.removeItem('everist_products');
        localStorage.removeItem('everist_cart');
        localStorage.removeItem('everist_orders');
        localStorage.removeItem('everist_current_user');
        
        console.log('✅ Данные сброшены');
    }
}

// Создаем глобальный экземпляр
window.dataService = new DataService();

// Функция для принудительной инициализации
window.initializeDataService = async function() {
    try {
        await window.dataService.initialize();
        return window.dataService;
    } catch (error) {
        console.error('❌ Ошибка принудительной инициализации:', error);
        return window.dataService;
    }
};

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM загружен, начинаем инициализацию DataService...');
    
    setTimeout(async () => {
        try {
            await window.dataService.initialize();
            console.log('✅ DataService готов к использованию');
        } catch (error) {
            console.error('❌ Ошибка автоматической инициализации:', error);
        }
    }, 100);
});

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}