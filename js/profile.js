// js/profile.js

let currentUser = null;

// Ожидание загрузки DataService
async function waitForDataService() {
    return new Promise((resolve, reject) => {
        if (window.dataService && window.dataService.isInitialized) {
            console.log('✅ DataService уже инициализирован');
            resolve(window.dataService);
            return;
        }
        
        console.log('⏳ Ожидание DataService в профиле...');
        
        const checkInterval = setInterval(() => {
            if (window.dataService && window.dataService.isInitialized) {
                clearInterval(checkInterval);
                clearTimeout(timeout);
                console.log('✅ DataService загружен через проверку');
                resolve(window.dataService);
            }
        }, 100);
        
        // Таймаут 5 секунд
        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            console.log('⚠️ Таймаут ожидания DataService');
            reject(new Error('DataService не загрузился'));
        }, 5000);
    });
}

// Инициализация профиля
async function initializeProfile() {
    console.log('👤 Инициализация профиля...');
    
    try {
        const dataService = await waitForDataService();
        
        // Проверяем авторизацию
        if (!dataService.isAuthenticated()) {
            console.log('❌ Пользователь не авторизован, перенаправляем на логин');
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = dataService.getCurrentUser();
        console.log('✅ Пользователь авторизован:', currentUser.email);
        
        // Обновляем интерфейс
        updateHeader(dataService);
        renderProfileHeader();
        renderPersonalInfo();
        renderOrders(dataService);
        renderCart(dataService);
        setupTabs();
        setupEditModal(dataService);
        
        console.log('✅ Профиль инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации профиля:', error);
        showErrorMessage();
    }
}

// Обновление header
function updateHeader(dataService) {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    const cartCount = currentUser ? dataService.getCartItemCount(currentUser.id) : 0;
    
    headerRight.innerHTML = `
        <a href="#" class="search-icon" onclick="event.preventDefault(); document.getElementById('searchInput')?.focus()">
            <i class="fas fa-search"></i>
        </a>
        <a href="profile.html" class="user-icon" title="${currentUser.email}">
            <i class="fas fa-user"></i>
            <span class="user-name">${currentUser.name?.split(' ')[0] || currentUser.email}</span>
        </a>
        <a href="cart.html" class="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
        </a>
        <button onclick="logout()" class="btn btn-outline" style="padding: 8px 16px; font-size: 14px;">
            Выйти
        </button>
    `;
}

// Рендеринг header профиля
function renderProfileHeader() {
    const profileHeader = document.getElementById('profileHeader');
    if (!profileHeader) return;
    
    profileHeader.innerHTML = `
        <div class="profile-avatar">
            <img src="${currentUser.avatar || 'https://i.pravatar.cc/150'}" alt="${currentUser.name}">
        </div>
        <div class="profile-info">
            <h1 class="profile-name">${currentUser.name}</h1>
            <div class="profile-email">${currentUser.email}</div>
            <div class="profile-meta">
                <span><i class="fas fa-calendar"></i> Зарегистрирован: ${currentUser.registrationDate}</span>
            </div>
        </div>
        <div class="profile-actions">
            <a href="shop.html" class="btn btn-primary">
                <i class="fas fa-shopping-bag"></i> Магазин
            </a>
            <a href="cart.html" class="btn btn-outline">
                <i class="fas fa-shopping-cart"></i> Корзина
            </a>
        </div>
    `;
}

// Рендеринг личной информации
function renderPersonalInfo() {
    const personalInfo = document.getElementById('personalInfo');
    const registrationDate = document.getElementById('registrationDate');
    
    if (!personalInfo || !registrationDate) return;
    
    personalInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Полное имя</span>
            <span class="info-value">${currentUser.name}</span>
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
    `;
    
    registrationDate.textContent = currentUser.registrationDate;
}

// Рендеринг заказов
function renderOrders(dataService) {
    const ordersList = document.getElementById('ordersList');
    const totalOrders = document.getElementById('totalOrders');
    
    if (!ordersList) return;
    
    // В реальном приложении получаем заказы из dataService
    const orders = dataService.getUserOrders ? dataService.getUserOrders(currentUser.id) : [];
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>Заказов пока нет</h3>
                <p>Совершите свою первую покупку в нашем магазине!</p>
                <a href="shop.html" class="btn btn-primary" style="margin-top: 20px;">
                    Перейти в магазин
                </a>
            </div>
        `;
        if (totalOrders) totalOrders.textContent = '0';
        return;
    }
    
    // Отображаем заказы
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">Заказ #${order.id}</div>
                <div class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            <div class="order-details">
                <div class="order-products">
                    ${order.products.map(p => {
                        const product = dataService.getProductById(p.productId);
                        if (!product) return '';
                        return `
                            <div class="order-product">
                                <img src="${product.image}" alt="${product.name}">
                                <div>
                                    <div class="order-product-name">${product.name}</div>
                                    <div>Количество: ${p.quantity}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div>
                    <div style="margin-bottom: 10px; font-weight: 500;">Дата заказа</div>
                    <div>${order.orderDate}</div>
                </div>
                <div>
                    <div style="margin-bottom: 10px; font-weight: 500;">Сумма</div>
                    <div class="order-total">$${order.total.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    if (totalOrders) totalOrders.textContent = orders.length.toString();
}

// Рендеринг корзины
function renderCart(dataService) {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (!cartItemsList || !cartTotal || !cartItemsCount) return;
    
    const cartItems = dataService.getCartItems(currentUser.id);
    const total = dataService.getCartTotal(currentUser.id);
    const itemCount = dataService.getCartItemCount(currentUser.id);
    
    if (cartItems.length === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <i class="fas fa-shopping-cart"></i>
                <h3>Корзина пуста</h3>
                <p>Добавьте товары из магазина</p>
            </div>
        `;
        cartTotal.textContent = '$0.00';
        cartItemsCount.textContent = '0 товаров';
        return;
    }
    
    // Отображаем товары в корзине
    cartItemsList.innerHTML = cartItems.map(item => {
        if (!item.product) return '';
        
        return `
            <div class="cart-item">
                <img src="${item.product.image}" alt="${item.product.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.name}</div>
                    <div class="cart-item-price">
                        $${item.product.price.toFixed(2)} × ${item.quantity} = $${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartItemsCount.textContent = `${itemCount} ${getPlural(itemCount, ['товар', 'товара', 'товаров'])}`;
}

// Настройка вкладок
function setupTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.profile-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
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
            
            // Если выбрана вкладка корзины, обновляем ее
            if (tabId === 'cart' && window.dataService) {
                renderCart(window.dataService);
            }
        });
    });
}

// Настройка модального окна редактирования
function setupEditModal(dataService) {
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) return;
            
            const updates = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                address: document.getElementById('editAddress').value
            };
            
            try {
                await dataService.updateUserProfile(currentUser.id, updates);
                alert('Профиль успешно обновлен!');
                closeEditModal();
                // Перезагружаем профиль
                currentUser = dataService.getCurrentUser();
                renderProfileHeader();
                renderPersonalInfo();
            } catch (error) {
                alert('Ошибка при обновлении профиля: ' + error.message);
            }
        });
    }
}

// Открытие модального окна редактирования
function editProfile() {
    if (!currentUser) return;
    
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editAddress').value = currentUser.address || '';
    
    document.getElementById('editProfileModal').style.display = 'flex';
}

// Закрытие модального окна
function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        if (window.dataService) {
            window.dataService.logoutUser();
        }
        window.location.href = '../index.html';
    }
}

// Получение текста статуса
function getStatusText(status) {
    const statuses = {
        'completed': 'Завершен',
        'pending': 'Ожидает оплаты',
        'processing': 'В обработке'
    };
    return statuses[status] || status;
}

// Получение правильной формы слова
function getPlural(n, forms) {
    n = Math.abs(n) % 100;
    let n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

// Показ сообщения об ошибке
function showErrorMessage() {
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;
    
    profileContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки профиля</h3>
            <p>Пожалуйста, попробуйте обновить страницу</p>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                Обновить страницу
            </button>
        </div>
    `;
}

// Дополнительные функции
function changePassword() {
    alert('Функция смены пароля в разработке');
}

function exportData() {
    if (!currentUser) return;
    
    const dataService = window.dataService;
    const userData = {
        profile: currentUser,
        cart: dataService.getCartItems(currentUser.id),
        orders: dataService.getUserOrders ? dataService.getUserOrders(currentUser.id) : []
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
                // В реальном приложении здесь был бы запрос на сервер
                alert('Аккаунт помечен на удаление. В реальном приложении здесь был бы вызов API.');
            }
        }
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализация профиля...');
    initializeProfile();
});

// Экспортируем функции для глобального использования
window.editProfile = editProfile;
window.closeEditModal = closeEditModal;
window.logout = logout;
window.changePassword = changePassword;
window.exportData = exportData;
window.deleteAccount = deleteAccount;