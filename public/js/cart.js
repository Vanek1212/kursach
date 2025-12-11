// cart.js - ПОЛНАЯ РАБОТАЮЩАЯ ВЕРСИЯ С СЕРВЕРОМ И КНОПКАМИ
let currentCartItems = [];
let currentUser = null;
let dataService = null;

// Основная инициализация
async function initializeCart() {
    console.log('🛒 Инициализация корзины...');
    
    try {
        showPreloader();
        
        // Ждем загрузки DataService
        await waitForDataService();
        
        if (!window.dataService) {
            throw new Error('DataService не доступен');
        }
        
        dataService = window.dataService;
        
        // Проверяем авторизацию
        if (!dataService.isAuthenticated()) {
            showLoginRequired();
            hidePreloader();
            return;
        }
        
        currentUser = dataService.getCurrentUser();
        console.log('👤 Текущий пользователь:', currentUser.email);
        
        // Загружаем данные корзины
        await loadCartData();
        
        // Обновляем UI
        updateHeader();
        renderCartItems();
        renderCartSummary();
        loadRecommendations();
        
        setupEventListeners();
        
        hidePreloader();
        
        console.log('✅ Корзина успешно инициализирована');
        
        // Слушаем события обновления корзины
        window.addEventListener('cartUpdated', handleCartUpdate);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации корзины:', error);
        hidePreloader();
        showErrorMessage();
    }
}

// Ожидание DataService
async function waitForDataService() {
    console.log('⏳ Ожидание DataService...');
    
    if (window.dataService && window.dataService.isInitialized) {
        return window.dataService;
    }
    
    return new Promise((resolve) => {
        const handler = () => {
            console.log('✅ DataService готов');
            window.removeEventListener('dataServiceReady', handler);
            clearTimeout(timeout);
            resolve(window.dataService);
        };
        
        window.addEventListener('dataServiceReady', handler);
        
        // Таймаут 5 секунд
        const timeout = setTimeout(() => {
            console.warn('⚠️ Таймаут ожидания DataService');
            window.removeEventListener('dataServiceReady', handler);
            resolve(window.dataService);
        }, 5000);
    });
}

// Загрузка данных корзины
async function loadCartData() {
    console.log('📦 Загрузка данных корзины...');
    
    try {
        if (!dataService || !currentUser) {
            throw new Error('Нет данных о пользователе');
        }
        
        // Получаем товары из корзины
        currentCartItems = dataService.getCartItems ? dataService.getCartItems() : [];
        
        // Если корзина пуста, пробуем загрузить из localStorage
        if (currentCartItems.length === 0) {
            await loadCartFromLocalStorage();
        }
        
        // Загружаем информацию о товарах
        await loadProductDetails();
        
        console.log(`🛒 Загружено ${currentCartItems.length} товаров`);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных корзины:', error);
        await loadCartFromLocalStorage();
        await loadProductDetails();
    }
}

// Загрузка корзины из localStorage (fallback)
async function loadCartFromLocalStorage() {
    try {
        console.log('🔄 Пробуем загрузить корзину из localStorage...');
        
        const savedUser = localStorage.getItem('everist_currentUser');
        if (!savedUser) {
            console.log('❌ Пользователь не найден в localStorage');
            return;
        }
        
        const user = JSON.parse(savedUser);
        const cartKey = `everist_cart_${user.id}`;
        const cartData = localStorage.getItem(cartKey);
        
        if (cartData) {
            const cartItems = JSON.parse(cartData);
            console.log(`🛒 Найдено ${cartItems.length} товаров в localStorage`);
            
            currentCartItems = cartItems;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки из localStorage:', error);
    }
}

// Загрузка деталей товаров
async function loadProductDetails() {
    try {
        // Загружаем список товаров
        let products = [];
        try {
            const response = await fetch('/data/data.json');
            if (response.ok) {
                const data = await response.json();
                products = data.products || [];
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки товаров:', error);
        }
        
        // Добавляем информацию о товарах к элементам корзины
        currentCartItems = currentCartItems.map(item => {
            const product = products.find(p => p.id == item.productId);
            return {
                ...item,
                product: product || {
                    id: item.productId,
                    name: item.productName || `Товар #${item.productId}`,
                    price: item.productPrice || 0,
                    image: item.productImage || 'https://via.placeholder.com/100',
                    category: item.productCategory || 'unknown'
                }
            };
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки деталей товаров:', error);
    }
}

// Рендеринг товаров в корзине
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (!cartItemsContainer) {
        console.error('❌ Контейнер cartItems не найден');
        return;
    }
    
    console.log(`📊 Рендеринг ${currentCartItems.length} товаров...`);
    
    if (currentCartItems.length === 0) {
        // Показываем пустую корзину
        cartItemsContainer.innerHTML = `
            <div class="empty-cart show">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <h3>Ваша корзина пуста</h3>
                <p>Добавьте товары из магазина</p>
                <a href="shop.html" class="btn btn-primary">
                    <i class="fas fa-store"></i> Перейти в магазин
                </a>
            </div>
        `;
        
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (clearCartBtn) clearCartBtn.disabled = true;
        return;
    }
    
    // Показываем корзину с товарами
    cartItemsContainer.innerHTML = currentCartItems.map((item, index) => {
        const product = item.product;
        if (!product) return '';
        
        const totalPrice = product.price * item.quantity;
        
        return `
            <div class="cart-item" data-product-id="${product.id}" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${product.image || 'https://via.placeholder.com/100'}" 
                         alt="${product.name}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/100'">
                </div>
                
                <div class="cart-item-info">
                    <h4 class="cart-item-name" onclick="viewProduct(${product.id})">
                        ${product.name}
                    </h4>
                    <div class="cart-item-category">${getCategoryName(product.category)}</div>
                    <div class="cart-item-price">$${totalPrice.toFixed(2)}</div>
                    <div class="cart-item-price-small">
                        $${product.price.toFixed(2)} × ${item.quantity}
                    </div>
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
    
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (clearCartBtn) clearCartBtn.disabled = false;
}

// Обновление количества товара
async function updateQuantity(productId, newQuantity) {
    if (!dataService || !currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
    if (newQuantity > 99) newQuantity = 99;
    
    try {
        console.log(`🔄 Обновление количества товара ${productId} на ${newQuantity}`);
        
        // Обновляем через DataService
        if (dataService.updateCartItemQuantity) {
            const result = await dataService.updateCartItemQuantity(productId, newQuantity);
            if (!result.success) {
                throw new Error(result.error || 'Ошибка обновления');
            }
        } else {
            // Fallback: обновляем локально
            await updateQuantityLocal(productId, newQuantity);
        }
        
        // Перезагружаем данные корзины
        await loadCartData();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Количество обновлено', 'success');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка обновления количества:', error);
        showNotification('Не удалось обновить количество: ' + error.message, 'error');
    }
}

// Локальное обновление количества (fallback)
async function updateQuantityLocal(productId, quantity) {
    if (!currentUser) return;
    
    const cartKey = `everist_cart_${currentUser.id}`;
    let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    const itemIndex = cartItems.findIndex(item => item.productId == productId);
    
    if (itemIndex !== -1) {
        if (quantity <= 0) {
            cartItems.splice(itemIndex, 1);
        } else {
            cartItems[itemIndex].quantity = quantity;
        }
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
}

// Удаление товара из корзины
async function removeFromCart(productId) {
    if (!dataService || !currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    if (!confirm('Удалить товар из корзины?')) return;
    
    try {
        console.log(`🗑️ Удаление товара ${productId} из корзины`);
        
        // Удаляем через DataService
        if (dataService.removeFromCart) {
            const result = await dataService.removeFromCart(productId);
            if (!result.success) {
                throw new Error(result.error || 'Ошибка удаления');
            }
        } else {
            // Fallback: удаляем локально
            await removeFromCartLocal(productId);
        }
        
        // Перезагружаем данные корзины
        await loadCartData();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Товар удален из корзины', 'info');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка удаления товара:', error);
        showNotification('Не удалось удалить товар: ' + error.message, 'error');
    }
}

// Локальное удаление (fallback)
async function removeFromCartLocal(productId) {
    if (!currentUser) return;
    
    const cartKey = `everist_cart_${currentUser.id}`;
    let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    cartItems = cartItems.filter(item => item.productId != productId);
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
}

// Очистка всей корзины
async function clearCart() {
    if (!dataService || !currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите очистить всю корзину?')) return;
    
    try {
        console.log('🧹 Очистка всей корзины');
        
        // Очищаем через DataService
        if (dataService.clearCart) {
            const result = await dataService.clearCart();
            if (!result.success) {
                throw new Error(result.error || 'Ошибка очистки');
            }
        } else {
            // Fallback: очищаем локально
            await clearCartLocal();
        }
        
        // Перезагружаем данные корзины
        await loadCartData();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Корзина очищена', 'info');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка очистки корзины:', error);
        showNotification('Не удалось очистить корзину: ' + error.message, 'error');
    }
}

// Локальная очистка (fallback)
async function clearCartLocal() {
    if (!currentUser) return;
    
    const cartKey = `everist_cart_${currentUser.id}`;
    localStorage.removeItem(cartKey);
}

// Обновление итоговой суммы
function renderCartSummary() {
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    
    if (!subtotalEl || !shippingEl || !discountEl || !totalEl) return;
    
    let subtotal = 0;
    
    // Считаем общую сумму
    currentCartItems.forEach(item => {
        if (item.product) {
            subtotal += item.product.price * item.quantity;
        }
    });
    
    const shipping = subtotal > 0 ? 5.00 : 0;
    const discount = calculateDiscount(subtotal);
    const total = subtotal + shipping - discount;
    
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    shippingEl.textContent = `$${shipping.toFixed(2)}`;
    discountEl.textContent = `-$${discount.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
    
    // Обновляем количество товаров
    const itemCount = currentCartItems.reduce((total, item) => total + item.quantity, 0);
    const itemsCountEl = document.getElementById('itemsCount');
    if (itemsCountEl) {
        itemsCountEl.textContent = `${itemCount} ${getPlural(itemCount, ['товар', 'товара', 'товаров'])}`;
    }
}

// Расчет скидки
function calculateDiscount(subtotal) {
    if (subtotal >= 100) {
        return subtotal * 0.10; // 10% скидка
    } else if (subtotal >= 50) {
        return subtotal * 0.05; // 5% скидка
    }
    return 0;
}

// Загрузка рекомендаций
function loadRecommendations() {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    if (!recommendationsGrid) return;
    
    try {
        // Пробуем загрузить товары
        fetch('/data/data.json')
            .then(response => response.json())
            .then(data => {
                const products = data.products || [];
                
                // Получаем ID товаров уже в корзине
                const cartProductIds = currentCartItems.map(item => item.productId);
                
                // Фильтруем товары, которых нет в корзине
                const availableProducts = products.filter(product => 
                    !cartProductIds.includes(product.id)
                );
                
                if (availableProducts.length === 0) {
                    recommendationsGrid.innerHTML = '<p class="no-recommendations">Нет рекомендаций</p>';
                    return;
                }
                
                // Выбираем случайные товары (до 4)
                const recommendations = [];
                const maxRecommendations = Math.min(4, availableProducts.length);
                
                for (let i = 0; i < maxRecommendations; i++) {
                    const randomIndex = Math.floor(Math.random() * availableProducts.length);
                    recommendations.push(availableProducts[randomIndex]);
                    availableProducts.splice(randomIndex, 1);
                }
                
                recommendationsGrid.innerHTML = recommendations.map(product => `
                    <div class="recommendation-card">
                        <div class="recommendation-image">
                            <img src="${product.image || 'https://via.placeholder.com/100'}" 
                                 alt="${product.name}"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/100'">
                        </div>
                        <h4 class="recommendation-name">${product.name}</h4>
                        <div class="recommendation-price">$${product.price.toFixed(2)}</div>
                        <button class="add-recommendation-btn" onclick="addRecommendationToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> Добавить
                        </button>
                    </div>
                `).join('');
            })
            .catch(error => {
                console.error('❌ Ошибка загрузки рекомендаций:', error);
                recommendationsGrid.innerHTML = '<p class="no-recommendations">Не удалось загрузить рекомендации</p>';
            });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки рекомендаций:', error);
        recommendationsGrid.innerHTML = '<p class="no-recommendations">Не удалось загрузить рекомендации</p>';
    }
}

// Добавление рекомендации в корзину
async function addRecommendationToCart(productId) {
    if (!dataService || !currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    try {
        console.log(`➕ Добавление рекомендации ${productId} в корзину`);
        
        // Добавляем через DataService
        if (dataService.addToCart) {
            const result = await dataService.addToCart(productId, 1);
            if (!result.success) {
                throw new Error(result.error || 'Ошибка добавления');
            }
        } else {
            // Fallback: добавляем локально
            await addToCartLocal(productId, 1);
        }
        
        // Перезагружаем данные корзины
        await loadCartData();
        renderCartItems();
        renderCartSummary();
        loadRecommendations();
        updateHeader();
        
        showNotification('Товар добавлен в корзину!', 'success');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка добавления рекомендации:', error);
        showNotification('Не удалось добавить товар: ' + error.message, 'error');
    }
}

// Локальное добавление (fallback)
async function addToCartLocal(productId, quantity) {
    if (!currentUser) return;
    
    const cartKey = `everist_cart_${currentUser.id}`;
    let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    const existingItem = cartItems.find(item => item.productId == productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({
            productId: productId,
            quantity: quantity,
            addedDate: new Date().toISOString().split('T')[0]
        });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
}

// Обновление заголовка
function updateHeader() {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    const user = currentUser;
    const cartCount = currentCartItems.reduce((total, item) => total + item.quantity, 0);
    
    let headerHTML = `
        <a href="#" class="search-icon" onclick="event.preventDefault(); document.getElementById('searchInput')?.focus()">
            <i class="fas fa-search"></i>
        </a>
    `;
    
    if (user) {
        headerHTML += `
            <a href="/pages/profile.html" class="user-icon" title="${user.email}">
                <i class="fas fa-user"></i>
                <span class="user-name">${user.name?.split(' ')[0] || 'Профиль'}</span>
            </a>
        `;
    } else {
        headerHTML += `
            <a href="/pages/login.html" class="user-icon">
                <i class="fas fa-user"></i>
                <span class="user-name">Войти</span>
            </a>
        `;
    }
    
    headerHTML += `
        <a href="/pages/cart.html" class="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            ${cartCount > 0 ? `<span class="cart-badge" style="display: flex">${cartCount}</span>` : '<span class="cart-badge" style="display: none">0</span>'}
        </a>
    `;
    
    headerRight.innerHTML = headerHTML;
}

// Обработчик обновления корзины
function handleCartUpdate() {
    console.log('🔄 Получено событие cartUpdated, обновляем корзину...');
    setTimeout(async () => {
        if (dataService && currentUser) {
            await loadCartData();
            renderCartItems();
            renderCartSummary();
            updateHeader();
        }
    }, 100);
}

// Настройка обработчиков событий
function setupEventListeners() {
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const continueShoppingBtn = document.querySelector('.continue-shopping');
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/pages/shop.html';
        });
    }
}

// Оформление заказа
async function checkout() {
    if (!dataService || !currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    if (currentCartItems.length === 0) {
        showNotification('Корзина пуста', 'info');
        return;
    }
    
    // Запрашиваем адрес доставки
    let deliveryAddress = currentUser.address || '';
    if (!deliveryAddress) {
        deliveryAddress = prompt('Введите адрес доставки:');
        if (!deliveryAddress) {
            showNotification('Адрес доставки обязателен', 'error');
            return;
        }
    }
    
    // Способ оплаты
    const paymentMethod = 'card';
    
    try {
        console.log('📦 Оформление заказа...');
        
        // Создаем заказ через DataService
        if (dataService.createOrder) {
            const result = await dataService.createOrder(deliveryAddress, paymentMethod);
            
            if (result.success) {
                showNotification(`Заказ #${result.orderId} успешно создан! Сумма: $${result.total.toFixed(2)}`, 'success');
                
                // Показываем подтверждение
                showOrderConfirmation(result);
                
                // Очищаем корзину после успешного заказа
                currentCartItems = [];
                renderCartItems();
                renderCartSummary();
                updateHeader();
                
                // Отправляем событие обновления
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            } else {
                throw new Error(result.error || 'Ошибка создания заказа');
            }
        } else {
            // Fallback: создаем заказ локально
            const order = await createOrderLocal(deliveryAddress, paymentMethod);
            showOrderConfirmation(order);
        }
        
    } catch (error) {
        console.error('❌ Ошибка оформления заказа:', error);
        showNotification('Не удалось оформить заказ: ' + error.message, 'error');
    }
}

// Создание заказа локально (fallback)
async function createOrderLocal(deliveryAddress, paymentMethod) {
    const orderId = Date.now();
    const subtotal = currentCartItems.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
    }, 0);
    
    const shipping = 5.00;
    const discount = calculateDiscount(subtotal);
    const total = subtotal + shipping - discount;
    
    // Сохраняем заказ в localStorage
    const ordersKey = `everist_orders_${currentUser.id}`;
    let orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    
    const order = {
        id: orderId,
        userId: currentUser.id,
        products: currentCartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
        })),
        total: total,
        status: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod
    };
    
    orders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(orders));
    
    // Очищаем корзину
    await clearCartLocal();
    
    return order;
}

// Подтверждение заказа
function showOrderConfirmation(order) {
    const modal = document.createElement('div');
    modal.className = 'order-confirmation-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.order-confirmation-modal').remove()">&times;</button>
            <h2>🎉 Заказ успешно оформлен!</h2>
            
            <div class="order-details">
                <div class="order-detail">
                    <span class="detail-label">Номер заказа:</span>
                    <span class="detail-value">#${order.orderId || order.id}</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Дата заказа:</span>
                    <span class="detail-value">${order.orderDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Сумма заказа:</span>
                    <span class="detail-value">$${order.total ? order.total.toFixed(2) : '0.00'}</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Статус:</span>
                    <span class="detail-value status-${order.status || 'pending'}">
                        ${order.status === 'completed' ? 'Оплачен' : 'Ожидает оплаты'}
                    </span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Адрес доставки:</span>
                    <span class="detail-value">${order.deliveryAddress || 'Не указан'}</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Способ оплаты:</span>
                    <span class="detail-value">${order.paymentMethod === 'card' ? 'Карта' : order.paymentMethod}</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button onclick="this.closest('.order-confirmation-modal').remove()" class="btn btn-primary">
                    Закрыть
                </button>
                <a href="/pages/profile.html" class="btn btn-outline">
                    <i class="fas fa-list"></i> Мои заказы
                </a>
            </div>
        </div>
    `;
    
    // Стили для модального окна
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
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

function getPlural(n, forms) {
    if (!n) return forms[2];
    n = Math.abs(n) % 100;
    let n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'info') icon = 'fa-info-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
    `;
    
    if (type === 'success') notification.style.background = '#4CAF50';
    if (type === 'info') notification.style.background = '#2196F3';
    if (type === 'error') notification.style.background = '#f44336';
    notification.style.color = 'white';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
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
            <a href="/pages/login.html" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Войти
            </a>
        </div>
    `;
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (clearCartBtn) clearCartBtn.disabled = true;
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

function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'flex';
        preloader.style.opacity = '1';
        preloader.style.visibility = 'visible';
    }
}

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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем корзину...');
    setTimeout(() => {
        initializeCart();
    }, 100);
});

// Глобальные функции
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.addRecommendationToCart = addRecommendationToCart;
window.checkout = checkout;