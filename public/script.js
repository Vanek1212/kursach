/* ===== КОНСТАНТЫ И НАСТРОЙКИ =====*/
const API_BASE_URL = 'http://localhost:3000';

// Глобальный объект для состояния приложения
window.appState = {
    currentUser: null,
    products: [],
    cart: [],
    cartItems: [],
    isInitialized: false
};

// ===== БАЗОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С API =====

// Универсальная функция для HTTP запросов
async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`📡 API запрос: ${endpoint}`, options);
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        // Добавляем токен авторизации если есть
        const token = localStorage.getItem('token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: defaultHeaders,
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ API ошибка (${endpoint}):`, error);
        throw error;
    }
}

// ===== ПРЕЛОАДЕР =====
function initPreloader() {
    console.log('🔄 Инициализация прелоадера...');
    
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        console.error('❌ Прелоадер не найден!');
        return;
    }
    
    // Принудительно задаем стили, которые игнорируют цветовые схемы
    preloader.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: #ffffff !important;
        z-index: 9999 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        transition: opacity 0.5s ease !important;
    `;
    
    // Защищаем внутренние элементы от цветовых схем
    const preloaderContent = preloader.querySelector('.preloader-content');
    if (preloaderContent) {
        preloaderContent.style.cssText = `
            text-align: center !important;
            color: #333333 !important;
        `;
    }
    
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.style.cssText = `
            color: #333333 !important;
            margin-bottom: 20px !important;
            font-size: 18px !important;
        `;
    }
    
    const progressBarContainer = document.getElementById('progressBarContainer');
    if (progressBarContainer) {
        progressBarContainer.style.cssText = `
            width: 200px !important;
            height: 4px !important;
            background: #e0e0e0 !important;
            border-radius: 2px !important;
            overflow: hidden !important;
            margin-bottom: 10px !important;
        `;
    }
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.cssText = `
            height: 100% !important;
            background: #1a5d4f !important;
            width: 0% !important;
            transition: width 0.3s ease !important;
        `;
    }
    
    const progressCounter = document.getElementById('progressCounter');
    if (progressCounter) {
        progressCounter.style.cssText = `
            color: #333333 !important;
            font-size: 14px !important;
        `;
    }
    
    preloader.classList.remove('hidden');
    
    const loadingMessages = [
        "Загрузка экологичных решений...",
        "Подготовка безводной формулы...",
        "Оптимизация для планеты...",
        "Создание экологичного опыта...",
        "Подключение эко-оптимистов..."
    ];
    
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    if (loadingText) {
        loadingText.textContent = randomMessage;
    }
    
    console.log('✅ Прелоадер инициализирован');
}

function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressCounter = document.getElementById('progressCounter');
    
    if (progressBar && progressCounter) {
        progressBar.style.transition = 'width 0.3s ease';
        progressBar.style.width = percent + '%';
        progressCounter.textContent = percent + '%';
        
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            if (percent === 30) loadingText.textContent = "Настройка интерфейса...";
            else if (percent === 60) loadingText.textContent = "Оптимизация изображений...";
            else if (percent >= 90) loadingText.textContent = "Завершение загрузки...";
        }
    }
}

function simulateLoading() {
    let progress = 70;
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
            
            setTimeout(() => {
                updateProgress(100);
                hidePreloader();
            }, 500);
        } else {
            updateProgress(Math.floor(progress));
        }
    }, 200);
}

function hidePreloader() {
    console.log('👋 Скрытие прелоадера...');
    
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    preloader.style.opacity = '0';
    
    setTimeout(() => {
        preloader.classList.add('hidden');
        preloader.style.display = 'none';
        console.log('✅ Прелоадер скрыт');
        
        document.body.style.overflow = '';
        showWelcomeMessage();
    }, 500);
}


// ===== АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ =====
async function loginUser(email, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            window.appState.currentUser = response.user;
            
            // Обновляем интерфейс
            updateUserInterface();
            showAccessibilityNotification('Успешный вход в систему!');
            
            // Загружаем корзину пользователя
            if (response.user && response.user.id) {
                await getCart(response.user.id);
            }
            
            return response;
        } else {
            throw new Error(response.error || 'Ошибка авторизации');
        }
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        showAccessibilityNotification('Ошибка входа: ' + error.message);
        throw error;
    }
}

async function registerUser(userData) {
    try {
        // Сначала проверяем email
        const emailCheck = await apiRequest(`/users/check-email/${encodeURIComponent(userData.email)}`);
        if (emailCheck.exists) {
            throw new Error('Пользователь с таким email уже существует');
        }
        
        const response = await apiRequest('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            showAccessibilityNotification('Регистрация успешна! Войдите в систему.');
            return response;
        } else {
            throw new Error(response.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        showAccessibilityNotification('Ошибка регистрации: ' + error.message);
        throw error;
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.appState.currentUser = null;
    window.appState.cart = [];
    window.appState.cartItems = [];
    
    updateUserInterface();
    updateCartBadge();
    updateAllCartButtons();
    showAccessibilityNotification('Вы вышли из системы');
}

function updateUserInterface() {
    const user = window.appState.currentUser;
    const authLinks = document.querySelectorAll('[data-auth]');
    
    authLinks.forEach(link => {
        if (user) {
            if (link.dataset.auth === 'hide-if-auth') link.style.display = 'none';
            if (link.dataset.auth === 'show-if-auth') link.style.display = 'block';
        } else {
            if (link.dataset.auth === 'hide-if-auth') link.style.display = 'block';
            if (link.dataset.auth === 'show-if-auth') link.style.display = 'none';
        }
    });
    
    // Обновляем информацию о пользователе в навигации
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        if (user) {
            userIcon.innerHTML = `<i class="fas fa-user-check"></i>`;
            userIcon.title = user.name || user.email;
        } else {
            userIcon.innerHTML = `<i class="fas fa-user"></i>`;
            userIcon.title = 'Войти в аккаунт';
        }
    }
}

// ===== ПРОДУКТЫ =====
async function loadProducts() {
    try {
        console.log('🛍️ Загрузка продуктов из API...');
        
        const products = await apiRequest('/products');
        
        // Сохраняем в глобальное состояние
        window.appState.products = products;
        
        // Отображаем на странице
        displayProducts(products);
        
        console.log(`✅ Загружено ${products.length} товаров`);
        updateProgress(80);
        
        return products;
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        
        // Fallback данные
        const fallbackProducts = [
            {
                id: 1,
                name: "Waterless Shampoo Paste",
                price: 24.00,
                oldPrice: 26.00,
                image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
                reviews: 85,
                description: "Безводный шампунь-паста для любых типов волос",
                category: "hair"
            },
            {
                id: 2,
                name: "Conditioner Concentrate", 
                price: 24.00,
                oldPrice: null,
                image: "https://images.unsplash.com/photo-1608248242905-5f2274e7d4d5?w=400",
                reviews: 10,
                description: "Концентрат кондиционера для увлажнения волос",
                category: "hair"
            },
            {
                id: 3,
                name: "Holiday Kit",
                price: 46.00,
                oldPrice: 48.00,
                image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400",
                reviews: 32,
                description: "Праздничный набор: шампунь + кондиционер",
                category: "kit"
            }
        ];
        
        displayProducts(fallbackProducts);
        window.appState.products = fallbackProducts;
        
        return fallbackProducts;
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.warn('❌ Контейнер productsGrid не найден');
        return;
    }
    
    // Очищаем грид
    grid.innerHTML = '';
    
    // Добавляем каждый продукт
    products.forEach(product => {
        const productCard = createProductCard(product);
        grid.appendChild(productCard);
    });
    
    console.log(`✅ Отображено ${products.length} товаров`);
    
    // Обновляем кнопки корзины после отрисовки
    setTimeout(updateAllCartButtons, 100);
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.dataset.productId = product.id;
    
    // Создаем HTML структуру карточки
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image || 'img/placeholder.jpg'}" 
                 alt="${product.name}" 
                 onerror="this.src='img/placeholder.jpg'">
            ${product.oldPrice ? '<div class="product-badge">Sale</div>' : ''}
        </div>
        <div class="product-info">
            <div class="reviews">
                <div class="stars">${'★'.repeat(5)}</div>
                <span>${product.reviews || 0} Reviews</span>
            </div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${product.oldPrice ? `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
            </p>
            ${product.description ? `<p class="product-description">${product.description.substring(0, 100)}...</p>` : ''}
            ${product.features && product.features.length > 0 ? 
                `<div class="product-features">
                    ${product.features.slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>` : ''}
            <button class="btn btn-outline add-to-cart-btn" 
                    data-product-id="${product.id}">
                <i class="fas fa-shopping-cart"></i> В корзину
            </button>
        </div>
    `;
    
    // Добавляем обработчик клика на кнопку
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product.id);
        });
    }
    
    // Добавляем обработчик клика на карточку для перехода к деталям
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.add-to-cart-btn')) {
            window.location.href = `pages/product.html?id=${product.id}`;
        }
    });
    
    return card;
}

// ===== КОРЗИНА =====
async function getCart(userId) {
    try {
        const cart = await apiRequest(`/cart/user/${userId}`);
        
        // Сохраняем в состояние
        window.appState.cart = cart;
        
        // Получаем полную информацию о товарах
        const cartItems = [];
        for (const item of cart) {
            try {
                const product = await apiRequest(`/products/${item.productId}`);
                cartItems.push({
                    ...item,
                    product: product,
                    total: product.price * item.quantity
                });
            } catch (error) {
                console.error(`❌ Ошибка загрузки товара ${item.productId}:`, error);
                cartItems.push({
                    ...item,
                    product: { 
                        id: item.productId, 
                        name: `Товар #${item.productId}`, 
                        price: 0,
                        image: 'img/placeholder.jpg'
                    },
                    total: 0
                });
            }
        }
        
        window.appState.cartItems = cartItems;
        
        // Обновляем интерфейс
        updateCartBadge();
        updateAllCartButtons();
        
        // Генерируем событие обновления корзины
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        return cartItems;
    } catch (error) {
        console.error('❌ Ошибка загрузки корзины:', error);
        window.appState.cart = [];
        window.appState.cartItems = [];
        updateCartBadge();
        return [];
    }
}

async function addToCart(productId, quantity = 1) {
    try {
        const user = window.appState.currentUser;
        if (!user) {
            showAccessibilityNotification('Пожалуйста, войдите в систему');
            window.location.href = 'pages/login.html';
            return;
        }
        
        // Проверяем, есть ли уже товар в корзине
        const existingItem = window.appState.cart.find(
            item => item.userId == user.id && item.productId == productId
        );
        
        let response;
        
        if (existingItem) {
            // Обновляем количество
            const newQuantity = existingItem.quantity + quantity;
            response = await apiRequest(`/cart/${existingItem.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity: newQuantity })
            });
        } else {
            // Добавляем новый товар
            response = await apiRequest('/cart', {
                method: 'POST',
                body: JSON.stringify({
                    userId: user.id,
                    productId: productId,
                    quantity: quantity,
                    addedDate: new Date().toISOString().split('T')[0]
                })
            });
        }
        
        if (response) {
            // Перезагружаем корзину
            await getCart(user.id);
            
            showAccessibilityNotification('Товар добавлен в корзину!');
            console.log(`🛒 Товар ${productId} добавлен в корзину`);
            
            return response;
        }
    } catch (error) {
        console.error('❌ Ошибка добавления в корзину:', error);
        showAccessibilityNotification('Ошибка: ' + error.message);
        throw error;
    }
}

async function updateCartItem(cartId, quantity) {
    try {
        const response = await apiRequest(`/cart/${cartId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity })
        });
        
        if (response) {
            const user = window.appState.currentUser;
            if (user) {
                await getCart(user.id);
                showAccessibilityNotification('Корзина обновлена');
            }
        }
        
        return response;
    } catch (error) {
        console.error('❌ Ошибка обновления корзины:', error);
        throw error;
    }
}

async function removeFromCart(cartId) {
    try {
        await apiRequest(`/cart/${cartId}`, {
            method: 'DELETE'
        });
        
        const user = window.appState.currentUser;
        if (user) {
            await getCart(user.id);
            showAccessibilityNotification('Товар удален из корзины');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка удаления из корзины:', error);
        throw error;
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    
    const totalItems = window.appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

function updateAllCartButtons() {
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    
    buttons.forEach(button => {
        const productId = button.getAttribute('data-product-id');
        if (!productId) return;
        
        // Проверяем, есть ли товар в корзине текущего пользователя
        const user = window.appState.currentUser;
        let isInCart = false;
        let cartItemId = null;
        
        if (user && window.appState.cart) {
            const cartItem = window.appState.cart.find(
                item => item.userId == user.id && item.productId == productId
            );
            isInCart = !!cartItem;
            cartItemId = cartItem ? cartItem.id : null;
        }
        
        if (isInCart) {
            button.innerHTML = '<i class="fas fa-check"></i> В корзине';
            button.classList.add('added');
            button.title = 'Нажмите, чтобы удалить из корзины';
            
            // Меняем обработчик на удаление
            button.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (cartItemId) {
                    await removeFromCart(cartItemId);
                }
            };
        } else {
            button.innerHTML = '<i class="fas fa-shopping-cart"></i> В корзину';
            button.classList.remove('added');
            button.title = '';
            
            // Меняем обработчик на добавление
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(parseInt(productId));
            };
        }
    });
}

// ===== ЗАКАЗЫ =====
async function createOrder(orderData) {
    try {
        const response = await apiRequest('/orders/create-from-cart', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        if (response.success) {
            showAccessibilityNotification('Заказ создан успешно!');
            return response;
        } else {
            throw new Error(response.error || 'Ошибка создания заказа');
        }
    } catch (error) {
        console.error('❌ Ошибка создания заказа:', error);
        throw error;
    }
}

async function getUserOrders(userId) {
    try {
        const orders = await apiRequest(`/orders/user/${userId}`);
        return orders;
    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        return [];
    }
}

// ===== ПОИСК И ФИЛЬТРАЦИЯ =====
async function searchProducts(query, category = null) {
    try {
        let url = `/products/search?q=${encodeURIComponent(query)}`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        const results = await apiRequest(url);
        return results;
    } catch (error) {
        console.error('❌ Ошибка поиска:', error);
        return [];
    }
}

async function getProductsByCategory(category) {
    try {
        const products = await apiRequest(`/products?category=${encodeURIComponent(category)}`);
        return products;
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров по категории:', error);
        return [];
    }
}

async function getPopularProducts(limit = 5) {
    try {
        const products = await apiRequest(`/products/popular?limit=${limit}`);
        return products;
    } catch (error) {
        console.error('❌ Ошибка загрузки популярных товаров:', error);
        return window.appState.products.slice(0, limit);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
async function initializeApp() {
    console.log('🚀 Инициализация приложения Everist...');
    
    window.startTime = Date.now();
    window.minLoadingTime = 1500;
    
    initPreloader();
    updateProgress(10);
    
    try {
        // 1. Инициализация языка
        console.log('🌐 Инициализация языка...');
        initLanguage();
        updateProgress(20);
        
        // 2. Инициализация доступности
        console.log('♿ Инициализация доступности...');
        initAccessibility();
        updateProgress(30);
        
        // 3. Проверка авторизации пользователя
        console.log('👤 Проверка авторизации...');
        await checkAuth();
        updateProgress(40);
        
        // 4. Инициализация бургер-меню
        console.log('🍔 Инициализация бургер-меню...');
        initBurgerMenu();
        updateProgress(50);
        
        // 5. Загрузка продуктов
        console.log('🛍️ Загрузка продуктов...');
        await loadProducts();
        updateProgress(70);
        
        // 6. Если пользователь авторизован - загружаем корзину
        if (window.appState.currentUser) {
            console.log('🛒 Загрузка корзины пользователя...');
            await getCart(window.appState.currentUser.id);
            updateProgress(80);
        }
        
        // 7. Инициализация слайдеров
        console.log('🔄 Инициализация слайдеров...');
        initSliders();
        updateProgress(90);
        
        // 8. Запуск финальной загрузки
        simulateLoading();
        
        // Отмечаем приложение как инициализированное
        window.appState.isInitialized = true;
        console.log('✅ Все модули инициализированы');
        
    } catch (error) {
        console.error('❌ Критическая ошибка при инициализации:', error);
        showAccessibilityNotification('Ошибка загрузки приложения');
        
        // Принудительно скрываем прелоадер при ошибке
        setTimeout(hidePreloader, 2000);
    }
}

async function checkAuth() {
    try {
        const userData = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        
        if (userData && token) {
            const user = JSON.parse(userData);
            window.appState.currentUser = user;
            
            // Проверяем валидность токена (опционально)
            console.log(`👤 Пользователь авторизован: ${user.email}`);
            
            // Обновляем интерфейс
            updateUserInterface();
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        return false;
    }
}

// ===== ОБЩИЕ ФУНКЦИИ =====
function showWelcomeMessage() {
    const notification = document.createElement('div');
    notification.className = 'welcome-notification';
    notification.innerHTML = `
        <div class="welcome-content">
            <span class="welcome-icon">🌿</span>
            <div class="welcome-text">
                <strong>Добро пожаловать в Everist!</strong>
                <small>Начните свой экологичный уход</small>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #1a5d4f;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideInRight 0.5s ease, fadeOutUp 0.5s ease 2.5s forwards;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        max-width: 300px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOutUp {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        .welcome-content { display: flex; align-items: center; gap: 12px; }
        .welcome-icon { font-size: 24px; }
        .welcome-text { display: flex; flex-direction: column; }
        .welcome-text strong { font-size: 14px; margin-bottom: 2px; }
        .welcome-text small { font-size: 12px; opacity: 0.9; }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
        if (style.parentNode) style.remove();
    }, 3000);
}

function showAccessibilityNotification(message) {
    const oldNotification = document.querySelector('.accessibility-notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = 'accessibility-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a5d4f;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: fadeInUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOutDown 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }
    }, 3000);
}

// Добавляем стили для анимаций уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(notificationStyles);

// ===== ФУНКЦИИ ДОСТУПНОСТИ =====

// Глобальные экземпляры менеджеров
let colorSchemeManager = null;
let imageManager = null;
let isAccessibilityInitialized = false;

// Класс для управления цветовыми схемами
class ColorSchemeManager {
    constructor() {
        this.schemes = [
            'white-black',    // Стандартная
            'black-white',    // Черный фон, белый текст
            'black-green',    // Черный фон, зеленый текст
            'beige-brown',    // Бежевый фон, коричневый текст
            'blue-darkblue'   // Голубой фон, темно-синий текст
        ];
        this.currentSchemeIndex = 0;
        this.button = document.getElementById('colorSchemeToggle');
        this.init();
    }
    
    init() {
        // Загружаем сохраненную схему из localStorage
        const savedScheme = localStorage.getItem('colorScheme');
        if (savedScheme) {
            this.currentSchemeIndex = this.schemes.indexOf(savedScheme);
            if (this.currentSchemeIndex === -1) this.currentSchemeIndex = 0;
            this.applyScheme(this.currentSchemeIndex, false);
        }
        
        // Назначаем обработчик события
        if (this.button) {
            this.button.addEventListener('click', () => {
                this.nextScheme();
            });
        }
    }
    
    nextScheme() {
        this.currentSchemeIndex = (this.currentSchemeIndex + 1) % this.schemes.length;
        this.applyScheme(this.currentSchemeIndex);
    }
    
    applyScheme(index, showNotification = true) {
        // Удаляем все атрибуты цветовых схем
        this.schemes.forEach(scheme => {
            document.documentElement.removeAttribute(`data-color-scheme-${scheme}`);
        });
        document.documentElement.removeAttribute('data-color-scheme');
        
        // Устанавливаем новую схему
        const scheme = this.schemes[index];
        document.documentElement.setAttribute('data-color-scheme', scheme);
        
        // Сохраняем в localStorage
        localStorage.setItem('colorScheme', scheme);
        
        // Обновляем иконку
        this.updateIcon(scheme);
        
        if (showNotification) {
            this.showNotification(this.getSchemeName(scheme));
        }
        
        console.log(`🎨 Цветовая схема установлена: ${scheme}`);
    }
    
    getSchemeName(scheme) {
        const names = {
            'white-black': 'Белый фон / Черный текст',
            'black-white': 'Черный фон / Белый текст',
            'black-green': 'Черный фон / Зеленый текст',
            'beige-brown': 'Бежевый фон / Коричневый текст',
            'blue-darkblue': 'Голубой фон / Темно-синий текст'
        };
        return names[scheme] || scheme;
    }
    
    updateIcon(scheme) {
        if (!this.button) return;
        
        const icon = this.button.querySelector('.color-scheme-icon');
        if (!icon) return;
        
        const icons = {
            'white-black': '⚫',
            'black-white': '⚪',
            'black-green': '🟢',
            'beige-brown': '🟤',
            'blue-darkblue': '🔵'
        };
        
        icon.textContent = icons[scheme] || '🎨';
    }
    
    showNotification(message) {
        showAccessibilityNotification(`Цветовая схема: ${message}`);
    }
    
    reset() {
        this.currentSchemeIndex = 0;
        this.applyScheme(0, false);
    }
}

// Класс для управления изображениями
class ImageManager {
    constructor() {
        this.isImagesDisabled = false;
        this.button = document.getElementById('imageToggle');
        this.icon = this.button ? this.button.querySelector('.image-icon') : null;
        this.init();
    }
    
    init() {
        // Загружаем сохраненное состояние из localStorage
        const savedState = localStorage.getItem('imagesDisabled');
        this.isImagesDisabled = savedState === 'true';
        
        // Применяем начальное состояние
        this.applyState(false);
        
        // Назначаем обработчик события
        if (this.button) {
            this.button.addEventListener('click', () => {
                this.toggle();
            });
        }
    }
    
    toggle() {
        this.isImagesDisabled = !this.isImagesDisabled;
        this.applyState();
        
        // Сохраняем в localStorage
        localStorage.setItem('imagesDisabled', this.isImagesDisabled);
        
        console.log(`🖼️ Изображения: ${this.isImagesDisabled ? 'отключены' : 'включены'}`);
    }
    
    applyState(showNotification = true) {
        if (this.isImagesDisabled) {
            document.body.classList.add('images-disabled');
            if (this.button) this.button.classList.add('active');
            if (this.icon) this.icon.textContent = '🚫';
            if (this.button) this.button.title = 'Включить изображения';
            
            if (showNotification) {
                showAccessibilityNotification('Изображения отключены');
            }
        } else {
            document.body.classList.remove('images-disabled');
            if (this.button) this.button.classList.remove('active');
            if (this.icon) this.icon.textContent = '🖼️';
            if (this.button) this.button.title = 'Отключить изображения';
            
            if (showNotification) {
                showAccessibilityNotification('Изображения включены');
            }
        }
    }
    
    reset() {
        this.isImagesDisabled = false;
        this.applyState(false);
        localStorage.removeItem('imagesDisabled');
    }
}

function initAccessibility() {
    // Защита от повторной инициализации
    if (isAccessibilityInitialized) {
        console.log('♿ Панель доступности уже инициализирована');
        return;
    }
    
    console.log('♿ Инициализация панели доступности...');
    
    try {
        // Инициализируем менеджеры
        colorSchemeManager = new ColorSchemeManager();
        imageManager = new ImageManager();
        
        // Загружаем настройки
        loadAccessibilitySettings();
        
        // Назначаем обработчики для кнопок размера шрифта
        const fontSizeButtons = document.querySelectorAll('.accessibility-btn[data-size]');
        fontSizeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const size = e.currentTarget.dataset.size;
                setFontSize(size);
            });
        });
        
        // Назначаем обработчики для других кнопок
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            updateThemeIcons();
        }
        
        const langToggle = document.getElementById('langToggle');
        if (langToggle) langToggle.addEventListener('click', toggleLanguage);
        
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) resetBtn.addEventListener('click', resetAccessibilitySettings);
        
        // Настраиваем поведение при скролле
        setupScrollBehavior();
        
        isAccessibilityInitialized = true;
        console.log('✅ Панель доступности инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации доступности:', error);
    }
}

function setFontSize(size, showNotification = true) {
    try {
        // Удаляем все классы размеров
        document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
        
        // Добавляем нужный класс
        document.body.classList.add(`font-${size}`);
        
        // Сохраняем в localStorage
        localStorage.setItem('fontSize', size);
        
        // Обновляем активные кнопки
        updateFontSizeButtons(size);
        
        if (showNotification) {
            showAccessibilityNotification(`Размер шрифта: ${getFontSizeLabel(size)}`);
        }
        
        console.log(`📏 Размер шрифта установлен: ${size}`);
    } catch (error) {
        console.error('❌ Ошибка установки размера шрифта:', error);
    }
}

function updateFontSizeButtons(activeSize) {
    try {
        const buttons = document.querySelectorAll('.accessibility-btn[data-size]');
        buttons.forEach(button => {
            if (button.dataset.size === activeSize) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('❌ Ошибка обновления кнопок шрифта:', error);
    }
}

function getFontSizeLabel(size) {
    const labels = {
        'small': 'Маленький',
        'medium': 'Стандартный',
        'large': 'Большой',
        'xlarge': 'Очень большой'
    };
    return labels[size] || size;
}

function toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcons();
        showAccessibilityNotification(`Тема: ${newTheme === 'dark' ? 'Тёмная' : 'Светлая'}`);
        
        console.log(`🌓 Тема изменена: ${newTheme}`);
    } catch (error) {
        console.error('❌ Ошибка переключения темы:', error);
    }
}

function updateThemeIcons() {
    try {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const sunIcon = themeToggle.querySelector('.theme-icon.sun');
        const moonIcon = themeToggle.querySelector('.theme-icon.moon');
        
        if (sunIcon && moonIcon) {
            if (currentTheme === 'dark') {
                sunIcon.style.display = 'inline';
                moonIcon.style.display = 'none';
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'inline';
            }
        }
    } catch (error) {
        console.error('❌ Ошибка обновления иконок темы:', error);
    }
}

function loadAccessibilitySettings() {
    try {
        // Загружаем тему
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Загружаем размер шрифта
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        setFontSize(savedFontSize, false);
        
        // Загружаем язык
        const savedLang = localStorage.getItem('language') || 'ru';
        updateLangButton(savedLang);
        
        // Обновляем иконки темы
        updateThemeIcons();
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек доступности:', error);
    }
}

function toggleLanguage() {
    try {
        const currentLang = localStorage.getItem('language') || 'ru';
        const newLang = currentLang === 'ru' ? 'en' : 'ru';
        
        document.documentElement.setAttribute('lang', newLang);
        localStorage.setItem('language', newLang);
        
        updateLangButton(newLang);
        showAccessibilityNotification(`Язык: ${newLang === 'ru' ? 'Русский' : 'English'}`);
        
        console.log(`🌐 Язык изменен: ${newLang}`);
    } catch (error) {
        console.error('❌ Ошибка переключения языка:', error);
    }
}

function updateLangButton(lang) {
    try {
        const button = document.getElementById('langToggle');
        if (!button) return;
        
        const icon = button.querySelector('.lang-icon');
        if (!icon) return;
        
        icon.textContent = lang === 'ru' ? 'EN' : 'RU';
    } catch (error) {
        console.error('❌ Ошибка обновления кнопки языка:', error);
    }
}

function initLanguage() {
    try {
        const savedLang = localStorage.getItem('language') || 'ru';
        document.documentElement.setAttribute('lang', savedLang);
        updateLangButton(savedLang);
        console.log(`🌐 Язык установлен: ${savedLang === 'ru' ? 'Русский' : 'English'}`);
    } catch (error) {
        console.error('❌ Ошибка инициализации языка:', error);
    }
}

function resetAccessibilitySettings() {
    try {
        if (confirm('Сбросить все настройки доступности?')) {
            // Сброс размера шрифта
            localStorage.removeItem('fontSize');
            setFontSize('medium', false);
            
            // Сброс темы
            localStorage.removeItem('theme');
            document.documentElement.removeAttribute('data-theme');
            updateThemeIcons();
            
            // Сброс цветовой схемы
            if (colorSchemeManager) {
                colorSchemeManager.reset();
            }
            
            // Сброс изображений
            if (imageManager) {
                imageManager.reset();
            }
            
            // Сброс языка
            localStorage.removeItem('language');
            document.documentElement.setAttribute('lang', 'ru');
            updateLangButton('ru');
            
            showAccessibilityNotification('Все настройки сброшены');
            console.log('🔄 Все настройки доступности сброшены');
        }
    } catch (error) {
        console.error('❌ Ошибка сброса настроек доступности:', error);
    }
}

function setupScrollBehavior() {
    try {
        const panel = document.querySelector('.accessibility-panel');
        if (!panel) {
            console.warn('⚠️ Панель доступности не найдена для настройки скролла');
            return;
        }
        
        let lastScrollY = window.scrollY;
        let scrollTimeout;
        
        const handleScroll = () => {
            // Отменяем предыдущий таймаут
            clearTimeout(scrollTimeout);
            
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            const isScrollingDown = currentScrollY > lastScrollY;
            
            // Если скроллим вниз и проскроллили больше 100px - скрываем
            if (isScrollingDown && currentScrollY > 100) {
                panel.classList.add('hidden');
            } 
            // Если скроллим вверх или в начале страницы - показываем
            else if (!isScrollingDown || currentScrollY < 50) {
                panel.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
            
            // Показываем панель через 1.5 секунды после остановки скролла
            scrollTimeout = setTimeout(() => {
                panel.classList.remove('hidden');
            }, 1500);
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // Показываем панель при наведении мыши
        panel.addEventListener('mouseenter', () => {
            panel.classList.remove('hidden');
            clearTimeout(scrollTimeout);
        });
        
        // Показываем панель при клике на нее
        panel.addEventListener('click', () => {
            panel.classList.remove('hidden');
            clearTimeout(scrollTimeout);
        });
        
        console.log('✅ Поведение при скролле настроено');
    } catch (error) {
        console.error('❌ Ошибка настройки скролла:', error);
    }
}

// Удалите эти строки из вашего скрипта:
// - Удалите строки с 860 по 877 (весь блок с document.addEventListener)
// - Удалите строки 882-883 (повторный вызов document.head.appendChild)
// ===== БУРГЕР-МЕНЮ =====
function initBurgerMenu() {
    console.log('🍔 Инициализация бургер-меню...');
    
    const burgerMenu = document.getElementById('burgerMenu');
    const navLinks = document.getElementById('navLinks');
    
    if (!burgerMenu || !navLinks) {
        console.error('❌ Элементы бургер-меню не найдены!');
        return;
    }
    
    function toggleMenu() {
        burgerMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            console.log('📱 Меню ОТКРЫТО');
        } else {
            document.body.style.overflow = '';
            console.log('📱 Меню ЗАКРЫТО');
        }
    }
    
    burgerMenu.addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        toggleMenu();
    });
    
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navLinks.contains(event.target);
        const isClickOnBurger = burgerMenu.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnBurger && navLinks.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    console.log('✅ Бургер-меню инициализировано');
}
// ===== ГЛОБАЛЬНЫЕ ЭКСПОРТЫ =====
window.addToCart = addToCart;
window.updateAllCartButtons = updateAllCartButtons;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.searchProducts = searchProducts;
window.getProductsByCategory = getProductsByCategory;
window.getPopularProducts = getPopularProducts;
window.createOrder = createOrder;
window.getUserOrders = getUserOrders;
window.getCart = getCart;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;

// Объект для отладки и доступа из консоли
window.everist = {
    resetSettings: resetAccessibilitySettings,
    setFontSize: setFontSize,
    toggleTheme: toggleTheme,
    toggleLanguage: toggleLanguage,
    getSettings: function() {
        return {
            fontSize: localStorage.getItem('everist_font_size') || 'medium',
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'ru',
            currentUser: window.appState.currentUser,
            productsCount: window.appState.products.length,
            cartCount: window.appState.cart.length,
            cartItems: window.appState.cartItems
        };
    },
    getState: function() {
        return window.appState;
    },
    refresh: async function() {
        if (window.appState.currentUser) {
            await getCart(window.appState.currentUser.id);
        }
        await loadProducts();
        updateAllCartButtons();
    }
};

// Обработчики ошибок
window.addEventListener('error', function(e) {
    console.error('❌ Ошибка загрузки:', e);
    setTimeout(hidePreloader, 3000);
});

window.addEventListener('load', function() {
    const elapsedTime = Date.now() - window.startTime;
    const remainingTime = window.minLoadingTime - elapsedTime;
    
    if (remainingTime > 0) {
        console.log(`⏳ Минимальное время загрузки: ждем еще ${remainingTime}мс`);
    }
});

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, запускаем приложение...');
    console.log(`🌐 API URL: ${API_BASE_URL}`);
    
    initializeApp();
});

console.log('✅ Everist App: Скрипт загружен и готов к работе');

// ===== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ КНОПОК КОРЗИНЫ =====
const cartButtonStyles = document.createElement('style');
cartButtonStyles.textContent = `
    .add-to-cart-btn.added {
        background-color: #1a5d4f !important;
        color: white !important;
        border-color: #1a5d4f !important;
    }
    
    .add-to-cart-btn.added:hover {
        background-color: #2a8c6f !important;
        border-color: #2a8c6f !important;
    }
    
    .feature-tag {
        display: inline-block;
        background-color: #f0f0f0;
        color: #333;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-right: 5px;
        margin-bottom: 5px;
    }
    
    .product-description {
        color: #666;
        font-size: 14px;
        line-height: 1.4;
        margin: 10px 0;
    }
`;
document.head.appendChild(cartButtonStyles);
document.head.appendChild(cartButtonStyles);
const swiper = new Swiper('.swiper', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,
  // Navigation arrows
  navigation: {
    nextEl: '.next',
    prevEl: '.prev',
  },});