// cart-fixed.js
const API_URL = 'http://localhost:3000';
let cartItems = [];
let currentUser = null;

// Основная инициализация
async function initializeCart() {
    console.log('🛒 Инициализация корзины...');
    
    try {
        showPreloader();
        
        // Получаем текущего пользователя
        const userData = localStorage.getItem('everist_currentUser');
        if (!userData) {
            showLoginRequired();
            hidePreloader();
            return;
        }
        
        currentUser = JSON.parse(userData);
        console.log('👤 Пользователь:', currentUser.email);
        
        // Загружаем корзину
        await loadCart();
        
        // Обновляем UI
        updateHeader();
        renderCartItems();
        renderCartSummary();
        loadRecommendations();
        
        setupEventListeners();
        
        hidePreloader();
        
        console.log('✅ Корзина загружена');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        hidePreloader();
        showErrorMessage();
    }
}

// Загрузка корзины с сервера
async function loadCart() {
    try {
        const response = await fetch(`${API_URL}/api/cart/user/${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки корзины');
        }
        
        const cartData = await response.json();
        
        // Загружаем информацию о товарах
        const productsResponse = await fetch(`${API_URL}/products`);
        const products = await productsResponse.json();
        
        cartItems = cartData.map(item => {
            const product = products.find(p => p.id == item.productId);
            return {
                ...item,
                product: product || {
                    id: item.productId,
                    name: `Товар #${item.productId}`,
                    price: 0,
                    image: 'https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=100',
                    description: 'Товар не найден'
                }
            };
        });
        
        console.log(`📦 Загружено ${cartItems.length} товаров`);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        cartItems = [];
    }
}

// Рендеринг товаров
function renderCartItems() {
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    
    if (!container) return;
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart show">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <h3>Ваша корзина пуста</h3>
                <p>Добавьте товары из магазина</p>
                <a href="shop.html" class="btn btn-primary">
                    <i class="fas fa-store"></i> Перейти в магазин
                </a>
            </div>
        `;
        
        document.getElementById('checkoutBtn').disabled = true;
        document.getElementById('clearCartBtn').disabled = true;
        return;
    }
    
    container.innerHTML = cartItems.map((item, index) => {
        const product = item.product;
        const total = product.price * item.quantity;
        
        return `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=100'">
                </div>
                
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <div class="cart-item-category">${getCategoryName(product.category)}</div>
                    <div class="cart-item-price">$${total.toFixed(2)}</div>
                    <div class="cart-item-price-small">
                        $${product.price.toFixed(2)} × ${item.quantity}
                    </div>
                </div>
                
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               class="quantity-input" 
                               value="${item.quantity}" 
                               min="1" 
                               max="99"
                               onchange="updateQuantity(${item.productId}, this.value)">
                        <button class="quantity-btn plus" onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <button class="remove-btn" onclick="removeItem(${item.productId})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('checkoutBtn').disabled = false;
    document.getElementById('clearCartBtn').disabled = false;
}

// Обновление количества
async function updateQuantity(productId, newQuantity) {
    if (!currentUser) return;
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
    if (newQuantity > 99) newQuantity = 99;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                productId: productId,
                quantity: newQuantity
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка обновления');
        }
        
        await loadCart();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Количество обновлено', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Не удалось обновить количество', 'error');
    }
}

// Удаление товара
async function removeItem(productId) {
    if (!currentUser) return;
    
    if (!confirm('Удалить товар из корзины?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/remove/${currentUser.id}/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления');
        }
        
        await loadCart();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Товар удален', 'info');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Не удалось удалить товар', 'error');
    }
}

// Очистка корзины
async function clearCart() {
    if (!currentUser) return;
    
    if (!confirm('Очистить всю корзину?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/clear/${currentUser.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка очистки');
        }
        
        cartItems = [];
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
        showNotification('Корзина очищена', 'info');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Не удалось очистить корзину', 'error');
    }
}

// Расчет итогов
function renderCartSummary() {
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += item.product.price * item.quantity;
    });
    
    const shipping = subtotal > 0 ? 5.00 : 0;
    const discount = subtotal >= 100 ? subtotal * 0.1 : subtotal >= 50 ? subtotal * 0.05 : 0;
    const total = subtotal + shipping - discount;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Обновление заголовка
function updateHeader() {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    let headerHTML = `
        <a href="#" class="search-icon">
            <i class="fas fa-search"></i>
        </a>
    `;
    
    if (currentUser) {
        headerHTML += `
            <a href="/pages/profile.html" class="user-icon">
                <i class="fas fa-user"></i>
                <span class="user-name">${currentUser.name?.split(' ')[0] || 'Профиль'}</span>
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
            ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
        </a>
    `;
    
    headerRight.innerHTML = headerHTML;
}

// Рекомендации
async function loadRecommendations() {
    const container = document.getElementById('recommendationsGrid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        // Исключаем товары уже в корзине
        const cartProductIds = cartItems.map(item => item.productId);
        const availableProducts = products.filter(p => !cartProductIds.includes(p.id));
        
        // Выбираем 4 случайных
        const recommendations = [];
        for (let i = 0; i < Math.min(4, availableProducts.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableProducts.length);
            recommendations.push(availableProducts[randomIndex]);
            availableProducts.splice(randomIndex, 1);
        }
        
        container.innerHTML = recommendations.map(product => `
            <div class="recommendation-card">
                <img src="${product.image}" alt="${product.name}">
                <h4>${product.name}</h4>
                <div class="price">$${product.price.toFixed(2)}</div>
                <button onclick="addToCart(${product.id})" class="add-btn">
                    <i class="fas fa-cart-plus"></i> Добавить
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки рекомендаций:', error);
    }
}

// Добавление в корзину
async function addToCart(productId) {
    if (!currentUser) {
        showNotification('Войдите в систему', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                productId: productId,
                quantity: 1
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка добавления');
        }
        
        await loadCart();
        renderCartItems();
        renderCartSummary();
        updateHeader();
        loadRecommendations();
        
        showNotification('Товар добавлен в корзину!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('Не удалось добавить товар', 'error');
    }
}

// Оформление заказа
async function checkout() {
    if (cartItems.length === 0) {
        showNotification('Корзина пуста', 'info');
        return;
    }
    
    // Запрос адреса
    let address = currentUser.address || '';
    if (!address) {
        address = prompt('Введите адрес доставки:');
        if (!address) {
            showNotification('Адрес обязателен', 'error');
            return;
        }
    }
    
    // Создание заказа
    const orderData = {
        userId: currentUser.id,
        products: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            productName: item.product.name
        })),
        total: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + 5,
        deliveryAddress: address,
        paymentMethod: 'card'
    };
    
    try {
        // Очищаем корзину
        await fetch(`${API_URL}/api/cart/clear/${currentUser.id}`, {
            method: 'DELETE'
        });
        
        // Показываем подтверждение
        alert(`Заказ оформлен! Сумма: $${orderData.total.toFixed(2)}\nАдрес: ${address}`);
        
        // Очищаем локальные данные
        cartItems = [];
        renderCartItems();
        renderCartSummary();
        updateHeader();
        
    } catch (error) {
        console.error('❌ Ошибка оформления:', error);
        showNotification('Ошибка оформления заказа', 'error');
    }
}

// Вспомогательные функции
function getCategoryName(category) {
    const map = {
        'hair': 'Для волос',
        'face': 'Для лица', 
        'body': 'Для тела',
        'kit': 'Наборы',
        'oral': 'Уход за ртом',
        'home': 'Для дома',
        'perfume': 'Ароматы'
    };
    return map[category] || category;
}

function showNotification(message, type = 'success') {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 10px 20px; border-radius: 5px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white; z-index: 1000;
    `;
    
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function setupEventListeners() {
    document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
}

function showLoginRequired() {
    document.getElementById('cartItems').innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-user-lock fa-3x"></i>
            <h3>Требуется вход</h3>
            <p>Войдите, чтобы увидеть корзину</p>
            <a href="login.html" class="btn btn-primary">Войти</a>
        </div>
    `;
}

function showErrorMessage() {
    document.getElementById('cartItems').innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-exclamation-triangle fa-3x"></i>
            <h3>Ошибка загрузки</h3>
            <button onclick="location.reload()" class="btn">Обновить</button>
        </div>
    `;
}

function showPreloader() {
    const el = document.getElementById('preloader');
    if (el) el.style.display = 'flex';
}

function hidePreloader() {
    const el = document.getElementById('preloader');
    if (el) el.style.display = 'none';
}

// Инициализация
document.addEventListener('DOMContentLoaded', initializeCart);

// Глобальные функции
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.addToCart = addToCart;
window.checkout = checkout;