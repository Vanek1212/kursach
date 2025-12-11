// profile.js - ПОЛНАЯ РАБОТАЮЩАЯ ВЕРСИЯ С КОРЗИНОЙ И ЗАКАЗАМИ

let currentUser = null;
let dataService = null;

// Основная инициализация
async function initializeProfile() {
    console.log('👤 Инициализация профиля...');
    
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
        console.log('✅ Пользователь авторизован:', currentUser.email);
        
        // Обновляем интерфейс
        updateHeader();
        renderProfileHeader();
        renderPersonalInfo();
        renderStats();
        setupTabs();
        setupEditModal();
        
        // Загружаем данные для активной вкладки
        const activeTab = document.querySelector('.profile-tab.active');
        if (activeTab) {
            const tabId = activeTab.dataset.tab;
            loadTabContent(tabId);
        }
        
        hidePreloader();
        
        console.log('✅ Профиль успешно инициализирован');
        
        // Слушаем события обновления корзины
        window.addEventListener('cartUpdated', handleCartUpdate);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации профиля:', error);
        hidePreloader();
        restoreFromLocalStorage();
    }
}

// Ожидание DataService
async function waitForDataService() {
    console.log('⏳ Ожидание DataService в профиле...');
    
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

// Загрузка контента вкладки
async function loadTabContent(tabId) {
    switch(tabId) {
        case 'orders':
            renderOrders();
            break;
        case 'cart':
            renderCart();
            break;
        case 'info':
            // Информация уже загружена
            break;
        case 'settings':
            // Настройки статические
            break;
    }
}

// Обновление заголовка
function updateHeader() {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    let cartCount = 0;
    if (dataService && dataService.getCartItemCount) {
        cartCount = dataService.getCartItemCount();
    } else {
        // Fallback на localStorage
        try {
            const savedUser = localStorage.getItem('everist_currentUser');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const cartKey = `everist_cart_${user.id}`;
                const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
                cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
            }
        } catch (e) {
            console.log('❌ Ошибка при чтении корзины');
        }
    }
    
    let headerHTML = `
        <a href="#" class="search-icon" onclick="event.preventDefault(); document.getElementById('searchInput')?.focus()">
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
        <button onclick="logout()" class="btn btn-outline logout-btn" title="Выйти">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;
    
    headerRight.innerHTML = headerHTML;
}

// Рендеринг header профиля
function renderProfileHeader() {
    const profileHeader = document.getElementById('profileHeader');
    if (!profileHeader || !currentUser) return;
    
    profileHeader.innerHTML = `
        <div class="profile-avatar">
            <img src="${currentUser.avatar || 'https://i.pravatar.cc/150'}" 
                 alt="${currentUser.name}"
                 onerror="this.onerror=null; this.src='https://i.pravatar.cc/150'">
            <button class="change-avatar-btn" onclick="changeAvatar()" title="Изменить аватар">
                <i class="fas fa-camera"></i>
            </button>
        </div>
        <div class="profile-info">
            <h1 class="profile-name">${currentUser.name || currentUser.email}</h1>
            <div class="profile-email">${currentUser.email}</div>
            <div class="profile-meta">
                <span><i class="fas fa-calendar"></i> Зарегистрирован: ${currentUser.registrationDate || 'Неизвестно'}</span>
                <span><i class="fas fa-id-badge"></i> ID: ${currentUser.id}</span>
            </div>
        </div>
        <div class="profile-actions">
            <a href="shop.html" class="btn btn-primary">
                <i class="fas fa-shopping-bag"></i> Магазин
            </a>
            <a href="cart.html" class="btn btn-outline">
                <i class="fas fa-shopping-cart"></i> Корзина
            </a>
            <button class="btn btn-outline" onclick="editProfile()">
                <i class="fas fa-edit"></i> Редактировать
            </button>
        </div>
    `;
}

// Рендеринг личной информации
function renderPersonalInfo() {
    const personalInfo = document.getElementById('personalInfo');
    const registrationDate = document.getElementById('registrationDate');
    
    if (!personalInfo || !registrationDate || !currentUser) return;
    
    personalInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Полное имя</span>
            <span class="info-value">${currentUser.name || 'Не указано'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">${currentUser.email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Телефон</span>
            <span class="info-value">${currentUser.phone || 'Не указан'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Адрес</span>
            <span class="info-value">${currentUser.address || 'Не указан'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Имя пользователя</span>
            <span class="info-value">${currentUser.username || 'Не указан'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Дата рождения</span>
            <span class="info-value">${currentUser.birthDate || 'Не указана'}</span>
        </div>
    `;
    
    registrationDate.textContent = currentUser.registrationDate || 'Неизвестно';
}

// Рендеринг статистики
function renderStats() {
    const totalOrders = document.getElementById('totalOrders');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (!totalOrders || !cartItemsCount || !dataService) return;
    
    try {
        // Заказы
        const orders = dataService.getUserOrders ? dataService.getUserOrders() : [];
        const totalOrdersCount = orders.length;
        totalOrders.textContent = totalOrdersCount;
        
        // Корзина
        let cartItemCount = 0;
        let cartTotal = 0;
        
        if (dataService.getCartItems) {
            const cartItems = dataService.getCartItems();
            cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
            cartTotal = cartItems.reduce((total, item) => {
                return total + (item.product?.price || 0) * (item.quantity || 0);
            }, 0);
        } else {
            // Fallback на localStorage
            const cartKey = `everist_cart_${currentUser.id}`;
            const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
            cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
        }
        
        cartItemsCount.textContent = `${cartItemCount} ${getPlural(cartItemCount, ['товар', 'товара', 'товаров'])}`;
        
    } catch (error) {
        console.error('❌ Ошибка рендеринга статистики:', error);
        totalOrders.textContent = '0';
        cartItemsCount.textContent = '0 товаров';
    }
}

// Рендеринг заказов
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    try {
        const orders = dataService.getUserOrders ? dataService.getUserOrders() : [];
        
        // Fallback на localStorage
        if (orders.length === 0) {
            const ordersKey = `everist_orders_${currentUser.id}`;
            const localOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
            orders.push(...localOrders);
        }
        
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag fa-3x"></i>
                    <h3>Заказов пока нет</h3>
                    <p>Совершите свою первую покупку в нашем магазине!</p>
                    <a href="shop.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-shopping-bag"></i> Перейти в магазин
                    </a>
                </div>
            `;
            return;
        }
        
        // Сортируем заказы по дате (новые сначала)
        orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        // Отображаем заказы
        ordersList.innerHTML = orders.map(order => {
            const orderDate = new Date(order.orderDate);
            const formattedDate = orderDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            return `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="order-header">
                        <div class="order-id">Заказ #${order.id}</div>
                        <div class="order-status status-${order.status || 'pending'}">
                            ${getStatusText(order.status)}
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-products">
                            <h4>Товары в заказе:</h4>
                            ${(order.products || []).map(product => {
                                const productName = product.productName || `Товар #${product.productId}`;
                                const productPrice = product.price || 0;
                                const itemTotal = productPrice * product.quantity;
                                
                                return `
                                    <div class="order-product">
                                        <div class="order-product-name">${productName}</div>
                                        <div class="order-product-details">
                                            <span>Количество: ${product.quantity}</span>
                                            <span>Цена: $${productPrice.toFixed(2)}</span>
                                            <span>Сумма: $${itemTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <div class="order-summary">
                            <div class="order-summary-item">
                                <span>Дата заказа:</span>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="order-summary-item">
                                <span>Адрес доставки:</span>
                                <span>${order.deliveryAddress || 'Не указан'}</span>
                            </div>
                            <div class="order-summary-item">
                                <span>Способ оплаты:</span>
                                <span>${order.paymentMethod === 'card' ? 'Карта' : order.paymentMethod}</span>
                            </div>
                            <div class="order-summary-item total">
                                <span>Итого:</span>
                                <span class="order-total">$${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn btn-sm btn-outline" onclick="repeatOrder(${order.id})">
                            <i class="fas fa-redo"></i> Повторить заказ
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="viewOrderDetails(${order.id})">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Ошибка рендеринга заказов:', error);
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <h3>Не удалось загрузить заказы</h3>
                <p>Попробуйте обновить страницу позже</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Обновить страницу
                </button>
            </div>
        `;
    }
}

// Рендеринг корзины
async function renderCart() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsList || !cartTotal) return;
    
    try {
        let cartItems = [];
        
        if (dataService.getCartItems) {
            cartItems = dataService.getCartItems();
        } else {
            // Fallback на localStorage
            const cartKey = `everist_cart_${currentUser.id}`;
            cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
            
            // Загружаем информацию о товарах
            try {
                const response = await fetch('/data/data.json');
                if (response.ok) {
                    const data = await response.json();
                    const products = data.products || [];
                    
                    cartItems = cartItems.map(item => {
                        const product = products.find(p => p.id == item.productId);
                        return {
                            ...item,
                            product: product || {
                                id: item.productId,
                                name: item.productName || `Товар #${item.productId}`,
                                price: item.productPrice || 0,
                                image: item.productImage || 'https://via.placeholder.com/100'
                            }
                        };
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка загрузки товаров:', error);
            }
        }
        
        if (cartItems.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <i class="fas fa-shopping-cart fa-3x"></i>
                    <h3>Корзина пуста</h3>
                    <p>Добавьте товары из магазина</p>
                    <a href="shop.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-shopping-bag"></i> Перейти в магазин
                    </a>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            return;
        }
        
        // Отображаем товары в корзине
        cartItemsList.innerHTML = cartItems.map(item => {
            if (!item.product) return '';
            
            const totalPrice = item.product.price * item.quantity;
            
            return `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <div class="cart-item-image">
                        <img src="${item.product.image || 'https://via.placeholder.com/50'}" 
                             alt="${item.product.name}"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/100'">
                    </div>
                    
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-category">${getCategoryName(item.product.category)}</div>
                        <div class="cart-item-price">
                            $${item.product.price.toFixed(2)} × ${item.quantity} = $${totalPrice.toFixed(2)}
                        </div>
                    </div>
                    
                    <div class="cart-item-actions">
                        <button class="btn btn-sm btn-outline" onclick="updateQuantityInProfile(${item.product.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline" onclick="updateQuantityInProfile(${item.product.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="removeFromCartInProfile(${item.product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Считаем общую сумму
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
        
    } catch (error) {
        console.error('❌ Ошибка рендеринга корзины:', error);
        cartItemsList.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <h3>Не удалось загрузить корзину</h3>
                <p>Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

// Обновление количества в профиле
async function updateQuantityInProfile(productId, newQuantity) {
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
    if (newQuantity > 99) newQuantity = 99;
    
    try {
        const cartKey = `everist_cart_${currentUser.id}`;
        let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        const itemIndex = cartItems.findIndex(item => item.productId == productId);
        
        if (itemIndex !== -1) {
            if (newQuantity <= 0) {
                cartItems.splice(itemIndex, 1);
            } else {
                cartItems[itemIndex].quantity = newQuantity;
            }
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
        
        // Пробуем обновить через DataService
        if (dataService && dataService.updateCartItemQuantity) {
            try {
                await dataService.updateCartItemQuantity(productId, newQuantity);
            } catch (error) {
                console.log('⚠️ Не удалось синхронизировать с сервером');
            }
        }
        
        // Обновляем отображение
        renderCart();
        updateHeader();
        renderStats();
        
        showNotification('Количество обновлено', 'success');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка обновления количества:', error);
        showNotification('Не удалось обновить количество', 'error');
    }
}

// Удаление из корзины в профиле
async function removeFromCartInProfile(productId) {
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    if (!confirm('Удалить товар из корзины?')) return;
    
    try {
        const cartKey = `everist_cart_${currentUser.id}`;
        let cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        cartItems = cartItems.filter(item => item.productId != productId);
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
        
        // Пробуем удалить через DataService
        if (dataService && dataService.removeFromCart) {
            try {
                await dataService.removeFromCart(productId);
            } catch (error) {
                console.log('⚠️ Не удалось синхронизировать с сервером');
            }
        }
        
        // Обновляем отображение
        renderCart();
        updateHeader();
        renderStats();
        
        showNotification('Товар удален из корзины', 'info');
        
        // Отправляем событие обновления
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
    } catch (error) {
        console.error('❌ Ошибка удаления товара:', error);
        showNotification('Не удалось удалить товар', 'error');
    }
}

// Обработчик обновления корзины
function handleCartUpdate() {
    console.log('🔄 Получено событие cartUpdated, обновляем корзину в профиле...');
    setTimeout(() => {
        // Обновляем статистику и заголовок
        updateHeader();
        renderStats();
        
        // Если активна вкладка корзины, обновляем ее
        const activeTab = document.querySelector('.profile-tab.active');
        if (activeTab && activeTab.dataset.tab === 'cart') {
            renderCart();
        }
    }, 100);
}

// Настройка вкладок
function setupTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.profile-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const tabId = tab.dataset.tab;
            
            // Обновляем активную вкладку
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем соответствующий контент
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Content`) {
                    content.classList.add('active');
                }
            });
            
            // Загружаем контент для выбранной вкладки
            await loadTabContent(tabId);
        });
    });
}

// Настройка модального окна редактирования
function setupEditModal() {
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showNotification('Ошибка: пользователь не авторизован', 'error');
                return;
            }
            
            const updates = {
                name: document.getElementById('editName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                address: document.getElementById('editAddress').value.trim(),
                username: document.getElementById('editUsername').value.trim(),
                birthDate: document.getElementById('editBirthDate').value
            };
            
            try {
                if (dataService && dataService.updateUserProfile) {
                    await dataService.updateUserProfile(updates);
                    showNotification('Профиль успешно обновлен!', 'success');
                } else {
                    // Локальное обновление
                    currentUser = { ...currentUser, ...updates };
                    localStorage.setItem('everist_currentUser', JSON.stringify(currentUser));
                    showNotification('Профиль обновлен локально!', 'success');
                }
                
                closeEditModal();
                
                // Перезагружаем профиль
                renderProfileHeader();
                renderPersonalInfo();
                updateHeader();
                
            } catch (error) {
                console.error('❌ Ошибка обновления профиля:', error);
                showNotification('Ошибка при обновлении профиля: ' + error.message, 'error');
            }
        });
    }
}

// Открытие модального окна редактирования
function editProfile() {
    if (!currentUser) return;
    
    // Заполняем поля формы
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        // Создаем элементы формы, если их нет
        if (!document.getElementById('editName')) {
            modal.querySelector('.modal-body').innerHTML = `
                <form id="editProfileForm">
                    <div class="form-group">
                        <label>Имя</label>
                        <input type="text" id="editName" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="editEmail" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Телефон</label>
                        <input type="tel" id="editPhone" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Адрес</label>
                        <textarea id="editAddress" class="form-control" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Имя пользователя</label>
                        <input type="text" id="editUsername" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Дата рождения</label>
                        <input type="date" id="editBirthDate" class="form-control">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary">Сохранить</button>
                        <button type="button" class="btn btn-outline" onclick="closeEditModal()">Отмена</button>
                    </div>
                </form>
            `;
            setupEditModal();
        }
        
        // Заполняем значения
        document.getElementById('editName').value = currentUser.name || '';
        document.getElementById('editEmail').value = currentUser.email || '';
        document.getElementById('editPhone').value = currentUser.phone || '';
        document.getElementById('editAddress').value = currentUser.address || '';
        document.getElementById('editUsername').value = currentUser.username || '';
        document.getElementById('editBirthDate').value = currentUser.birthDate || '';
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна
function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        if (dataService && dataService.logoutUser) {
            dataService.logoutUser();
        } else {
            // Локальный выход
            localStorage.removeItem('everist_currentUser');
        }
        window.location.href = '../index.html';
    }
}

// Восстановление из localStorage
function restoreFromLocalStorage() {
    console.log('🔄 Пытаемся восстановить из localStorage...');
    
    const savedUser = localStorage.getItem('everist_currentUser');
    if (!savedUser) {
        console.log('❌ Пользователь не найден в localStorage');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(savedUser);
        console.log('✅ Пользователь восстановлен из localStorage:', currentUser.email);
        
        // Минимальный рендеринг
        renderProfileHeader();
        renderPersonalInfo();
        renderStats();
        setupTabs();
        
        // Показываем предупреждение
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.innerHTML += `
                <div class="alert alert-warning" style="margin: 20px; padding: 15px; border-radius: 5px; background: #fff3cd; border: 1px solid #ffeaa7;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Режим ограниченной функциональности:</strong> 
                    Некоторые функции могут быть недоступны. Проверьте соединение с сервером.
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Ошибка восстановления из localStorage:', error);
        window.location.href = 'login.html';
    }
}

// Вспомогательные функции
function getStatusText(status) {
    const statuses = {
        'completed': 'Завершен',
        'pending': 'Ожидает оплаты',
        'processing': 'В обработке',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
    };
    return statuses[status] || status || 'Ожидает оплаты';
}

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
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;
    
    profileContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-user-lock fa-4x" style="color: #ccc; margin-bottom: 20px;"></i>
            <h2>Требуется авторизация</h2>
            <p>Пожалуйста, войдите в систему, чтобы просмотреть профиль</p>
            <div style="margin-top: 30px;">
                <a href="login.html" class="btn btn-primary" style="margin-right: 10px;">
                    <i class="fas fa-sign-in-alt"></i> Войти
                </a>
                <a href="../index.html" class="btn btn-outline">
                    <i class="fas fa-home"></i> На главную
                </a>
            </div>
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

// Дополнительные функции
function changeAvatar() {
    alert('Функция смены аватара в разработке');
}

function changePassword() {
    alert('Функция смены пароля в разработке');
}

function exportData() {
    if (!currentUser) return;
    
    const userData = {
        profile: currentUser,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `everist-data-${currentUser.email}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function deleteAccount() {
    if (confirm('ВНИМАНИЕ! Это действие удалит ваш аккаунт и все данные навсегда. Вы уверены?')) {
        if (confirm('Для подтверждения введите "DELETE" в поле ниже:')) {
            const input = prompt('Введите DELETE для подтверждения удаления:');
            if (input === 'DELETE') {
                // Получаем ID текущего пользователя
                const userId = currentUser?.id || JSON.parse(localStorage.getItem('everist_currentUser'))?.id;
                
                if (!userId) {
                    showNotification('Ошибка: не найден ID пользователя', 'error');
                    return;
                }
                
                // 1. Удаляем пользователя с сервера
                fetch(`http://localhost:3000/users/${userId}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    console.log('✅ Пользователь удален с сервера');
                    
                    // 2. Удаляем корзину пользователя с сервера
                    return fetch(`http://localhost:3000/cart?userId=${userId}`);
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(cartItems => {
                    // Удаляем все товары из корзины пользователя
                    const deletePromises = cartItems.map(item => 
                        fetch(`http://localhost:3000/cart/${item.id}`, {
                            method: 'DELETE',
                        })
                    );
                    return Promise.all(deletePromises);
                })
                .then(() => {
                    console.log('✅ Корзина пользователя удалена с сервера');
                    
                    // 3. Удаляем заказы пользователя с сервера
                    return fetch(`http://localhost:3000/orders?userId=${userId}`);
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(orders => {
                    // Удаляем все заказы пользователя
                    const deletePromises = orders.map(order => 
                        fetch(`http://localhost:3000/orders/${order.id}`, {
                            method: 'DELETE',
                        })
                    );
                    return Promise.all(deletePromises);
                })
                .then(() => {
                    console.log('✅ Заказы пользователя удалены с сервера');
                    
                    // 4. Очищаем локальное хранилище
                    localStorage.removeItem('everist_currentUser');
                    localStorage.removeItem('token');
                    localStorage.removeItem(`everist_cart_${userId}`);
                    localStorage.removeItem(`everist_orders_${userId}`);
                    
                    // 5. Сбрасываем глобальные переменные
                    currentUser = null;
                    if (window.dataService) {
                        window.dataService.currentUser = null;
                        window.dataService.cart = [];
                        window.dataService.orders = [];
                    }
                    
                    showNotification('Аккаунт и все данные успешно удалены. Перенаправляем на главную...', 'success');
                    
                    // 6. Перенаправляем на главную с небольшим таймаутом
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('❌ Ошибка при удалении аккаунта:', error);
                    showNotification('Произошла ошибка при удалении аккаунта: ' + error.message, 'error');
                });
            } else {
                showNotification('Удаление отменено. Неправильное подтверждение.', 'info');
            }
        } else {
            showNotification('Удаление отменено', 'info');
        }
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализация профиля...');
    setTimeout(() => {
        initializeProfile();
    }, 100);
});

// Глобальные функции
window.editProfile = editProfile;
window.closeEditModal = closeEditModal;
window.logout = logout;
window.changeAvatar = changeAvatar;
window.changePassword = changePassword;
window.exportData = exportData;
window.deleteAccount = deleteAccount;
window.updateQuantityInProfile = updateQuantityInProfile;
window.removeFromCartInProfile = removeFromCartInProfile;
