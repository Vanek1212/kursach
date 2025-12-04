// js/cart.js - Функционал корзины

// Основная инициализация
async function initializeCart() {
    console.log('🛒 Инициализация корзины...');
    
    try {
        showPreloader();
        
        await waitForDataService();
        
        const dataService = window.dataService;
        const currentUser = dataService.getCurrentUser ? dataService.getCurrentUser() : null;
        
        if (!currentUser) {
            showLoginRequired();
            hidePreloader();
            return;
        }
        
        updateHeader(dataService);
        loadCartItems(currentUser.id);
        loadRecommendations();
        
        // Назначаем обработчики кнопок
        setupEventListeners();
        
        hidePreloader();
        
        console.log('✅ Корзина успешно инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации корзины:', error);
        hidePreloader();
        showErrorMessage();
    }
}

// Показ прелоадера
function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'flex';
        preloader.style.opacity = '1';
        preloader.style.visibility = 'visible';
        
        let progress = 0;
        const progressBar = document.getElementById('progressBar');
        const progressCounter = document.getElementById('progressCounter');
        
        if (progressBar && progressCounter) {
            const interval = setInterval(() => {
                progress += 1;
                if (progress <= 100) {
                    progressBar.style.width = progress + '%';
                    progressCounter.textContent = progress + '%';
                } else {
                    clearInterval(interval);
                }
            }, 30);
        }
    }
}

// Скрытие прелоадера
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
}

// Ждем готовности dataService
async function waitForDataService() {
    return new Promise((resolve) => {
        if (window.dataService && window.dataService.isReady()) {
            resolve(window.dataService);
            return;
        }
        
        const eventHandler = (e) => {
            window.removeEventListener('dataServiceReady', eventHandler);
            clearTimeout(timeout);
            resolve(window.dataService);
        };
        
        window.addEventListener('dataServiceReady', eventHandler);
        
        const timeout = setTimeout(() => {
            window.removeEventListener('dataServiceReady', eventHandler);
            if (window.dataService) {
                resolve(window.dataService);
            }
        }, 3000);
    });
}

// Обновление заголовка
function updateHeader(dataService) {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    const currentUser = dataService.getCurrentUser ? dataService.getCurrentUser() : null;
    const cartCount = currentUser ? dataService.getCartItemCount(currentUser.id) : 0;
    
    let headerHTML = `
        <a href="#" class="search-icon" onclick="event.preventDefault(); document.getElementById('searchInput').focus()">
            <i class="fas fa-search"></i>
        </a>
    `;
    
    if (currentUser) {
        headerHTML += `
            <a href="profile.html" class="user-icon" title="${currentUser.email}">
                <i class="fas fa-user"></i>
                <span class="user-name">${currentUser.name?.split(' ')[0] || 'Профиль'}</span>
            </a>
        `;
    } else {
        headerHTML += `
            <a href="login.html" class="user-icon">
                <i class="fas fa-user"></i>
                <span class="user-name">Войти</span>
            </a>
        `;
    }
    
    headerHTML += `
        <a href="cart.html" class="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            ${cartCount > 0 ? `<span class="cart-badge" style="display: flex">${cartCount}</span>` : '<span class="cart-badge" style="display: none">0</span>'}
        </a>
    `;
    
    headerRight.innerHTML = headerHTML;
}

// Загрузка товаров в корзине
function loadCartItems(userId) {
    const dataService = window.dataService;
    if (!dataService) {
        console.error('❌ DataService не доступен');
        return;
    }
    
    const cartItems = dataService.getCartItems(userId);
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    console.log(`🛒 Товаров в корзине: ${cartItems.length}`);
    
    if (cartItems.length === 0) {
        emptyCart.classList.add('show');
        cartItemsContainer.innerHTML = '';
        checkoutBtn.disabled = true;
        updateSummary({ subtotal: 0, shipping: 5, discount: 0, total: 5 });
        return;
    }
    
    emptyCart.classList.remove('show');
    checkoutBtn.disabled = false;
    
    // Рендерим товары
    cartItemsContainer.innerHTML = cartItems.map(item => {
        const product = item.product;
        if (!product) return '';
        
        const totalPrice = product.price * item.quantity;
        
        return `
            <div class="cart-item" data-product-id="${product.id}">
                <div class="cart-item-image">
                    <img src="${product.image || 'https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=200&auto=format&fit=crop'}" 
                         alt="${product.name}"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=200&auto=format&fit=crop'">
                </div>
                
                <div class="cart-item-info">
                    <h4 class="cart-item-name" onclick="viewProduct(${product.id})">${product.name}</h4>
                    <div class="cart-item-category">${getCategoryName(product.category)}</div>
                    <div class="cart-item-price">$${totalPrice.toFixed(2)}</div>
                    <div class="cart-item-price-small">$${product.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" onclick="updateQuantity(${product.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               class="quantity-input" 
                               value="${item.quantity}" 
                               min="1" 
                               max="99"
                               onchange="updateQuantity(${product.id}, this.value)">
                        <button class="quantity-btn plus" onclick="updateQuantity(${product.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <button class="remove-btn" onclick="removeFromCart(${product.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Обновляем итоговую сумму
    const subtotal = dataService.getCartTotal(userId);
    const shipping = 5.00;
    const discount = calculateDiscount(subtotal);
    const total = subtotal + shipping - discount;
    
    updateSummary({ subtotal, shipping, discount, total });
}

// Обновление количества товара
async function updateQuantity(productId, newQuantity) {
    const dataService = window.dataService;
    if (!dataService) {
        showNotification('Сервис корзины не доступен', 'error');
        return;
    }
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
        newQuantity = 1;
    }
    
    if (newQuantity > 99) {
        newQuantity = 99;
    }
    
    try {
        await dataService.updateCartItemQuantity(currentUser.id, productId, newQuantity);
        loadCartItems(currentUser.id);
        updateHeader(dataService);
        showNotification('Количество обновлено', 'success');
        
        // Отправляем событие обновления корзины
        window.dispatchEvent(new Event('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка обновления количества:', error);
        showNotification('Не удалось обновить количество', 'error');
    }
}

// Удаление товара из корзины
async function removeFromCart(productId) {
    const dataService = window.dataService;
    if (!dataService) {
        showNotification('Сервис корзины не доступен', 'error');
        return;
    }
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    if (!confirm('Удалить товар из корзины?')) {
        return;
    }
    
    try {
        await dataService.removeFromCart(currentUser.id, productId);
        loadCartItems(currentUser.id);
        updateHeader(dataService);
        showNotification('Товар удален из корзины', 'info');
        
        // Отправляем событие обновления корзины
        window.dispatchEvent(new Event('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка удаления товара:', error);
        showNotification('Не удалось удалить товар', 'error');
    }
}

// Очистка корзины
async function clearCart() {
    const dataService = window.dataService;
    if (!dataService) {
        showNotification('Сервис корзины не доступен', 'error');
        return;
    }
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    if (!confirm('Очистить всю корзину?')) {
        return;
    }
    
    try {
        await dataService.clearCart(currentUser.id);
        loadCartItems(currentUser.id);
        updateHeader(dataService);
        showNotification('Корзина очищена', 'info');
        
        // Отправляем событие обновления корзины
        window.dispatchEvent(new Event('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка очистки корзины:', error);
        showNotification('Не удалось очистить корзину', 'error');
    }
}

// Обновление итоговой суммы
function updateSummary({ subtotal, shipping, discount, total }) {
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Расчет скидки
function calculateDiscount(subtotal) {
    if (subtotal >= 100) {
        return subtotal * 0.10; // 10% скидка при заказе от $100
    } else if (subtotal >= 50) {
        return subtotal * 0.05; // 5% скидка при заказе от $50
    }
    return 0;
}

// Загрузка рекомендаций
function loadRecommendations() {
    const dataService = window.dataService;
    if (!dataService) return;
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) return;
    
    const allProducts = dataService.getAllProducts();
    const cartItems = dataService.getCartItems(currentUser.id);
    
    // Получаем ID товаров уже в корзине
    const cartProductIds = cartItems.map(item => item.productId);
    
    // Фильтруем товары, которых нет в корзине
    const availableProducts = allProducts.filter(product => 
        !cartProductIds.includes(product.id)
    );
    
    // Выбираем 4 случайных товара
    const recommendations = [];
    const maxRecommendations = Math.min(4, availableProducts.length);
    
    for (let i = 0; i < maxRecommendations; i++) {
        const randomIndex = Math.floor(Math.random() * availableProducts.length);
        recommendations.push(availableProducts[randomIndex]);
        availableProducts.splice(randomIndex, 1);
    }
    
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    if (!recommendationsGrid) return;
    
    if (recommendations.length === 0) {
        recommendationsGrid.innerHTML = '<p class="no-recommendations">Нет рекомендаций</p>';
        return;
    }
    
    recommendationsGrid.innerHTML = recommendations.map(product => `
        <div class="recommendation-card">
            <div class="recommendation-image">
                <img src="${product.image || 'https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=200&auto=format&fit=crop'}" 
                     alt="${product.name}"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=200&auto=format&fit=crop'">
            </div>
            <h4 class="recommendation-name">${product.name}</h4>
            <div class="recommendation-price">$${product.price.toFixed(2)}</div>
            <button class="add-recommendation-btn" onclick="addRecommendationToCart(${product.id})">
                <i class="fas fa-cart-plus"></i> Добавить
            </button>
        </div>
    `).join('');
}

// Добавление рекомендации в корзину
async function addRecommendationToCart(productId) {
    const dataService = window.dataService;
    if (!dataService) {
        showNotification('Сервис корзины не доступен', 'error');
        return;
    }
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    try {
        await dataService.addToCart(currentUser.id, productId, 1);
        loadCartItems(currentUser.id);
        loadRecommendations();
        updateHeader(dataService);
        showNotification('Товар добавлен в корзину!', 'success');
        
        // Отправляем событие обновления корзины
        window.dispatchEvent(new Event('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка добавления товара:', error);
        showNotification('Не удалось добавить товар', 'error');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
}

// Вспомогательные функции
function getCategoryName(category) {
    const categories = {
        'hair': 'Для волос',
        'face': 'Для лица',
        'body': 'Для тела',
        'kit': 'Наборы',
        'oral': 'Уход за полостью рта',
        'home': 'Для дома',
        'perfume': 'Ароматы'
    };
    return categories[category] || category;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    if (!notification || !messageEl) return;
    
    // Устанавливаем сообщение и стиль
    messageEl.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Показываем уведомление
    notification.classList.add('show');
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showLoginRequired() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = `
        <div class="empty-cart show">
            <i class="fas fa-user-lock fa-3x"></i>
            <h3>Требуется авторизация</h3>
            <p>Пожалуйста, войдите в систему, чтобы просмотреть корзину</p>
            <a href="login.html" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Войти
            </a>
        </div>
    `;
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
    }
}

function showErrorMessage() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = `
        <div class="empty-cart show">
            <i class="fas fa-exclamation-triangle fa-3x"></i>
            <h3>Ошибка загрузки корзины</h3>
            <p>Пожалуйста, попробуйте обновить страницу</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Обновить страницу
            </button>
        </div>
    `;
}

// Просмотр товара
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
    // Если страницы продукта нет, можно открыть модальное окно или перенаправить в магазин
}

// Оформление заказа
async function checkout() {
    const dataService = window.dataService;
    if (!dataService) {
        showNotification('Сервис корзины не доступен', 'error');
        return;
    }
    
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    const cartItems = dataService.getCartItems(currentUser.id);
    if (cartItems.length === 0) {
        showNotification('Корзина пуста', 'info');
        return;
    }
    
    // В реальном приложении здесь будет переход на страницу оформления заказа
    // или показ модального окна с формой оформления
    
    alert('Функция оформления заказа в разработке\n\nВ будущем здесь будет:\n1. Форма доставки\n2. Выбор способа оплаты\n3. Подтверждение заказа');
    
    /*
    try {
        const order = await dataService.createOrder(currentUser.id);
        showNotification(`Заказ #${order.id} успешно оформлен!`, 'success');
        loadCartItems(currentUser.id);
        updateHeader(dataService);
    } catch (error) {
        console.error('❌ Ошибка оформления заказа:', error);
        showNotification('Не удалось оформить заказ', 'error');
    }
    */
}

// Экспортируем функции для глобального использования
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.addRecommendationToCart = addRecommendationToCart;
window.checkout = checkout;
window.viewProduct = viewProduct;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем корзину...');
    
    setTimeout(() => {
        initializeCart();
    }, 100);
});