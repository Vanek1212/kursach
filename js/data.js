// js/data.js

// Исправляем путь к файлу данных
const API_URL = '/data/data.json'; // Изменено с 'data.json' на '../data.json'

class DataService {
    constructor() {
        this.data = null;
        this.users = [];
        this.products = [];
        this.cart = [];
        this.orders = [];
        this.currentUser = null;
        this.isInitialized = false; // Флаг инициализации
    }

    // Загрузка данных с локального JSON файла
    async loadData() {
        try {
            console.log('📥 Загрузка данных из:', API_URL);
            
            // Пробуем несколько способов загрузки
            let response;
            try {
                response = await fetch(API_URL);
            } catch (fetchError) {
                console.log('🔄 Пробуем альтернативный путь...');
                // Пробуем другие возможные пути
                const altPaths = [
                    'data.json',
                    '/data.json',
                    'data/data.json',
                    '../data/data.json'
                ];
                
                for (const path of altPaths) {
                    try {
                        response = await fetch(path);
                        if (response.ok) break;
                    } catch (e) {
                        continue;
                    }
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Не удалось загрузить данные. Статус: ${response ? response.status : 'no response'}`);
            }
            
            this.data = await response.json();
            
            // Инициализируем данные
            this.users = this.data.users || [];
            this.products = this.data.products || [];
            this.cart = this.data.cart || [];
            this.orders = this.data.orders || [];
            
            console.log('✅ Данные успешно загружены:', {
                users: this.users.length,
                products: this.products.length,
                cart: this.cart.length,
                orders: this.orders.length
            });
            
            // Логируем несколько первых товаров для отладки
            if (this.products.length > 0) {
                console.log('📊 Первые 3 товара:', this.products.slice(0, 3));
            }
            
            return this.data;
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            
            // Пробуем загрузить из localStorage как fallback
            try {
                this.loadFromLocalStorage();
                if (this.products.length > 0) {
                    console.log('🔄 Используем данные из localStorage');
                    return this.data;
                }
            } catch (localError) {
                console.log('⚠️ Не удалось загрузить из localStorage:', localError);
            }
            
            // Если ничего не работает, загружаем демо-данные
            console.log('🔄 Загружаем демо-данные...');
            this.loadDemoProducts();
            
            return this.data;
        }
    }

    // Загрузка демо-данных если JSON не загрузился
    loadDemoProducts() {
        console.log('🛠️ Создание демо-товаров...');
        
        // Создаем демо-товары на основе вашего data.json
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
            }
        ];
        
        // Используем существующих пользователей или создаем демо-пользователя
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
                    registrationDate: "2023-01-01"
                }
            ];
        }
        
        this.cart = [];
        this.orders = [];
        
        console.log('✅ Демо-данные загружены:', this.products.length, 'товаров');
    }

    // Сохранение данных в localStorage
    saveData() {
        try {
            // Обновляем this.data
            this.data = {
                users: this.users,
                products: this.products,
                cart: this.cart,
                orders: this.orders
            };
            
            // Сохраняем отдельные массивы в localStorage
            localStorage.setItem('everist_users', JSON.stringify(this.users));
            localStorage.setItem('everist_products', JSON.stringify(this.products));
            localStorage.setItem('everist_cart', JSON.stringify(this.cart));
            localStorage.setItem('everist_orders', JSON.stringify(this.orders));
            
            // Сохраняем текущего пользователя
            if (this.currentUser) {
                localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
            }
            
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
        }
    }

    // Загрузка текущего пользователя
    loadCurrentUser() {
        try {
            const savedUser = localStorage.getItem('everist_current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                console.log('👤 Текущий пользователь загружен:', this.currentUser.email);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            this.currentUser = null;
        }
    }

    // ===== ПОЛЬЗОВАТЕЛИ =====
    registerUser(email, password, name, phone = '', address = '') {
        // Проверяем, нет ли уже пользователя с таким email
        const existingUser = this.users.find(user => user.email === email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        const newUser = {
            id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
            email,
            password, // В реальном приложении нужно хэшировать пароль!
            name,
            avatar: `https://i.pravatar.cc/150?img=${this.users.length + 1}`,
            phone,
            address,
            registrationDate: new Date().toISOString().split('T')[0]
        };

        this.users.push(newUser);
        this.saveData();
        console.log('✅ Новый пользователь зарегистрирован:', email);
        
        return newUser;
    }

    loginUser(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Неверный email или пароль');
        }

        this.currentUser = { ...user };
        localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
        console.log('🔐 Пользователь авторизован:', email);
        
        return user;
    }

    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('everist_current_user');
        console.log('👋 Пользователь вышел из системы');
    }

    updateUserProfile(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        
        // Обновляем текущего пользователя, если это он
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = { ...this.currentUser, ...updates };
            localStorage.setItem('everist_current_user', JSON.stringify(this.currentUser));
        }
        
        this.saveData();
        console.log('📝 Профиль пользователя обновлен:', userId);
        
        return this.users[userIndex];
    }

    // ===== ТОВАРЫ =====
    getAllProducts() {
        console.log('📊 Получение всех товаров:', this.products?.length || 0);
        return this.products || [];
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
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)
        );
    }

    // ===== КОРЗИНА =====
    getCartItems(userId) {
        if (!this.cart) return [];
        
        const userCart = this.cart.filter(item => item.userId === userId);
        
        // Добавляем информацию о товарах
        return userCart.map(item => {
            const product = this.getProductById(item.productId);
            return {
                ...item,
                product: product || null,
                totalPrice: product ? product.price * item.quantity : 0
            };
        });
    }

    addToCart(userId, productId, quantity = 1) {
        // Проверяем, есть ли уже этот товар в корзине
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

        this.saveData();
        console.log('🛒 Товар добавлен в корзину:', { userId, productId, quantity });
        
        return this.getCartItems(userId);
    }

    updateCartItemQuantity(userId, productId, quantity) {
        const cartItem = this.cart.find(
            item => item.userId === userId && item.productId === productId
        );

        if (!cartItem) {
            throw new Error('Товар не найден в корзине');
        }

        if (quantity <= 0) {
            // Удаляем товар из корзины
            this.cart = this.cart.filter(
                item => !(item.userId === userId && item.productId === productId)
            );
        } else {
            cartItem.quantity = quantity;
        }

        this.saveData();
        console.log('🔄 Количество товара обновлено:', { userId, productId, quantity });
        
        return this.getCartItems(userId);
    }

    removeFromCart(userId, productId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(
            item => !(item.userId === userId && item.productId === productId)
        );

        if (this.cart.length < initialLength) {
            this.saveData();
            console.log('🗑️ Товар удален из корзины:', { userId, productId });
        }
        
        return this.getCartItems(userId);
    }

    clearCart(userId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.userId !== userId);
        
        if (this.cart.length < initialLength) {
            this.saveData();
            console.log('🧹 Корзина очищена для пользователя:', userId);
        }
        
        return this.getCartItems(userId);
    }

    getCartTotal(userId) {
        const cartItems = this.getCartItems(userId);
        return cartItems.reduce((total, item) => {
            return total + (item.product ? item.product.price * item.quantity : 0);
        }, 0);
    }

    getCartItemCount(userId) {
        if (!this.cart) return 0;
        const userCart = this.cart.filter(item => item.userId === userId);
        return userCart.reduce((total, item) => total + item.quantity, 0);
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    async initialize() {
        try {
            console.log('🚀 Инициализация DataService...');
            
            // Загружаем из localStorage первым делом
            this.loadFromLocalStorage();
            
            // Загружаем из JSON файла
            await this.loadData();
            
            // Загружаем текущего пользователя
            this.loadCurrentUser();
            
            // Сохраняем данные если они не были в localStorage
            this.saveData();
            
            this.isInitialized = true;
            
            console.log('✅ DataService инициализирован');
            console.log('📦 Товаров доступно:', this.products.length);
            console.log('👥 Пользователей:', this.users.length);
            
            // Отправляем событие что dataService готов
            window.dispatchEvent(new Event('dataServiceReady'));
            
            return this;
        } catch (error) {
            console.error('❌ Ошибка инициализации DataService:', error);
            this.isInitialized = true;
            return this;
        }
    }

    loadFromLocalStorage() {
        try {
            console.log('📥 Загрузка из localStorage...');
            
            const savedUsers = localStorage.getItem('everist_users');
            const savedProducts = localStorage.getItem('everist_products');
            const savedCart = localStorage.getItem('everist_cart');
            const savedOrders = localStorage.getItem('everist_orders');

            if (savedProducts) {
                const parsedProducts = JSON.parse(savedProducts);
                if (parsedProducts.length > 0) {
                    this.products = parsedProducts;
                    console.log('🛍️ Товары из localStorage:', this.products.length);
                }
            }
            if (savedUsers) {
                const parsedUsers = JSON.parse(savedUsers);
                if (parsedUsers.length > 0) {
                    this.users = parsedUsers;
                }
            }
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
            if (savedOrders) {
                this.orders = JSON.parse(savedOrders);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
    }

    // Проверка авторизации
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // Обновление бейджа корзины
    updateCartBadge() {
        if (!this.currentUser) return;

        const count = this.getCartItemCount(this.currentUser.id);
        const badges = document.querySelectorAll('.cart-badge');
        
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        });
    }
}

// Создаем глобальный экземпляр
window.dataService = new DataService();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('📄 DOM загружен, инициализация DataService...');
        
        // Не ждем завершения, чтобы не блокировать загрузку
        window.dataService.initialize().then(() => {
            console.log('✅ DataService готов к использованию');
            
            // Обновляем бейдж корзины
            window.dataService.updateCartBadge();
            
            // Отправляем событие что все готово
            document.dispatchEvent(new Event('shopDataReady'));
        });
        
    } catch (error) {
        console.error('❌ Не удалось инициализировать DataService:', error);
    }
});