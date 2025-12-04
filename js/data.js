// js/data.js

const API_URL = 'data/data.json';

class DataService {
    constructor() {
        this.data = null;
        this.users = [];
        this.products = [];
        this.cart = [];
        this.currentUser = null;
    }

    // Загрузка данных с локального JSON файла
    async loadData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            
            // Инициализируем данные
            this.users = this.data.users || [];
            this.products = this.data.products || [];
            this.cart = this.data.cart || [];
            
            // Загружаем текущего пользователя из localStorage
            this.loadCurrentUser();
            
            console.log('✅ Данные успешно загружены:', {
                users: this.users.length,
                products: this.products.length,
                cart: this.cart.length
            });
            
            return this.data;
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            throw error;
        }
    }

    // Сохранение данных в localStorage
    saveData() {
        try {
            // Сохраняем отдельные массивы в localStorage
            localStorage.setItem('everist_users', JSON.stringify(this.users));
            localStorage.setItem('everist_products', JSON.stringify(this.products));
            localStorage.setItem('everist_cart', JSON.stringify(this.cart));
            
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
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)
        );
    }

    // ===== КОРЗИНА =====
    getCartItems(userId) {
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
        const userCart = this.cart.filter(item => item.userId === userId);
        return userCart.reduce((total, item) => total + item.quantity, 0);
    }

    // ===== ЗАКАЗЫ =====
    createOrder(userId, deliveryAddress = '') {
        const cartItems = this.getCartItems(userId);
        
        if (cartItems.length === 0) {
            throw new Error('Корзина пуста');
        }

        const total = this.getCartTotal(userId);
        
        // Создаем заказ
        const order = {
            id: this.data.orders && this.data.orders.length > 0 
                ? Math.max(...this.data.orders.map(o => o.id)) + 1 
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

        // Добавляем заказ
        this.data.orders = this.data.orders || [];
        this.data.orders.push(order);

        // Очищаем корзину пользователя
        this.clearCart(userId);

        this.saveData();
        console.log('📦 Заказ создан:', order.id);
        
        return order;
    }

    getUserOrders(userId) {
        return (this.data.orders || []).filter(order => order.userId === userId);
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    async initialize() {
        try {
            await this.loadData();
            
            // Проверяем, нужно ли создать начальные данные в localStorage
            if (!localStorage.getItem('everist_users')) {
                this.saveData();
            }
            
            // Загружаем данные из localStorage
            this.loadFromLocalStorage();
            
            return this;
        } catch (error) {
            console.error('❌ Ошибка инициализации DataService:', error);
            throw error;
        }
    }

    loadFromLocalStorage() {
        try {
            const savedUsers = localStorage.getItem('everist_users');
            const savedProducts = localStorage.getItem('everist_products');
            const savedCart = localStorage.getItem('everist_cart');

            if (savedUsers) {
                this.users = JSON.parse(savedUsers);
            }
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
            }
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
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
        const badge = document.getElementById('cartBadge');
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Создаем глобальный экземпляр
window.dataService = new DataService();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.dataService.initialize();
        
        // Обновляем бейдж корзины
        window.dataService.updateCartBadge();
        
        console.log('✅ DataService инициализирован');
    } catch (error) {
        console.error('❌ Не удалось инициализировать DataService:', error);
    }
});
// Создаем Promise для контроля готовности
window.dataServiceReady = window.dataService.initialize()
    .then(() => {
        console.log('✅ DataService полностью инициализирован');
        return window.dataService;
    })
    .catch(error => {
        console.error('❌ Ошибка инициализации DataService:', error);
        throw error;
    });