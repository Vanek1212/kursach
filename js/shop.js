// js/shop.js - Исправленная версия для скрытия прелоадера

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 9;

// Ждем готовности dataService
async function waitForDataService() {
    console.log('⏳ Ожидание DataService...');
    
    // Если dataService уже готов
    if (window.dataService && window.dataService.isDataLoaded) {
        console.log('✅ DataService уже загружен');
        return window.dataService;
    }
    
    // Ждем события готовности
    return new Promise((resolve) => {
        const eventHandler = (e) => {
            console.log('✅ Событие dataServiceReady получено');
            window.removeEventListener('dataServiceReady', eventHandler);
            clearTimeout(timeout);
            resolve(window.dataService);
        };
        
        window.addEventListener('dataServiceReady', eventHandler);
        
        // Таймаут на случай если событие не придет
        const timeout = setTimeout(() => {
            console.log('⚠️ Таймаут ожидания DataService, продолжаем...');
            window.removeEventListener('dataServiceReady', eventHandler);
            if (window.dataService) {
                resolve(window.dataService);
            } else {
                // Создаем пустой dataService для продолжения работы
                window.dataService = {
                    getAllProducts: () => [],
                    getCurrentUser: () => null,
                    getCartItems: () => [],
                    getCartItemCount: () => 0
                };
                resolve(window.dataService);
            }
        }, 3000);
    });
}

// Основная инициализация
async function initializeShop() {
    console.log('🛍️ Инициализация магазина...');
    
    try {
        // Сразу показываем прелоадер
        showPreloader();
        
        // Ждем готовности dataService
        const dataService = await waitForDataService();
        
        console.log('✅ DataService готов, загружаем товары...');
        
        // Получаем товары
        allProducts = dataService.getAllProducts();
        console.log('📦 Получено товаров:', allProducts.length);
        
        if (allProducts.length === 0) {
            console.warn('⚠️ Нет товаров для отображения');
            showEmptyState();
            hidePreloader(); // Скрываем прелоадер
            return;
        }
        
        // Преобразуем данные
        allProducts = allProducts.map(product => ({
            ...product,
            price: parseFloat(product.price) || 0,
            oldPrice: product.oldPrice ? parseFloat(product.oldPrice) : null,
            rating: product.rating || 4.0,
            reviews: product.reviews || 0,
            features: product.features || [],
            description: product.description || "Описание отсутствует"
        }));
        
        filteredProducts = [...allProducts];
        
        // Обновляем интерфейс
        updateHeader(dataService);
        renderProducts();
        renderPagination();
        setupFilters();
        setupSearch();
        setupCategories();
        
        // Скрываем прелоадер
        hidePreloader();
        
        console.log('✅ Магазин успешно инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации магазина:', error);
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
        
        // Анимация загрузки
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
        console.log('👋 Скрытие прелоадера...');
        
        // Сначала анимация исчезновения
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        // Затем скрываем полностью
        setTimeout(() => {
            preloader.style.display = 'none';
            console.log('✅ Прелоадер скрыт');
        }, 500);
    } else {
        console.log('⚠️ Прелоадер не найден');
    }
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

// Рендеринг товаров
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('❌ productsGrid не найден');
        return;
    }
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`📊 Рендеринг товаров: ${productsToShow.length} из ${filteredProducts.length}`);
    
    if (productsToShow.length === 0) {
        showEmptyState();
        return;
    }
    
    const dataService = window.dataService || {};
    const currentUser = dataService.getCurrentUser ? dataService.getCurrentUser() : null;
    const cartItems = currentUser ? dataService.getCartItems ? dataService.getCartItems(currentUser.id) : [] : [];
    
    productsGrid.innerHTML = productsToShow.map(product => {
        const isInCart = cartItems.some(item => item.productId === product.id);
        const hasDiscount = product.oldPrice && product.oldPrice > product.price;
        const discountPercent = hasDiscount 
            ? Math.round((product.oldPrice - product.price) / product.oldPrice * 100)
            : 0;
        
        let badge = '';
        if (hasDiscount && discountPercent > 0) {
            badge = `<div class="product-badge sale">-${discountPercent}%</div>`;
        } else if (product.reviews < 20) {
            badge = `<div class="product-badge new">NEW</div>`;
        } else if (product.reviews > 80) {
            badge = `<div class="product-badge">BESTSELLER</div>`;
        }
        
        // Используем изображение из данных или заглушку
        const imageUrl = product.image || 'https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400&auto=format&fit=crop';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${badge}
                
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400&auto=format&fit=crop'">
                    <div class="quick-view" onclick="showProductDetail(${product.id})">
                        <i class="fas fa-eye"></i> Быстрый просмотр
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="product-category">${getCategoryName(product.category)}</div>
                    <h3 class="product-name" title="${product.name}">${product.name}</h3>
                    <p class="product-description">${product.description || 'Описание товара'}</p>
                    
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${hasDiscount ? `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                    
                    <div class="product-reviews">
                        <div class="stars">${getStarRating(product.rating || 4)}</div>
                        <span class="review-count">${product.reviews || 0} отзывов</span>
                    </div>
                    
                    ${product.features && product.features.length > 0 ? `
                    <div class="product-features">
                        ${product.features.slice(0, 2).map(feature => 
                            `<span class="feature-tag">${feature}</span>`
                        ).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="product-actions">
                        <button class="add-to-cart-btn ${isInCart ? 'added' : ''}" 
                                onclick="addToCart(${product.id})"
                                ${!currentUser ? 'disabled title="Войдите, чтобы добавить в корзину"' : ''}>
                            ${isInCart ? '<i class="fas fa-check"></i> В корзине' : '<i class="fas fa-shopping-cart"></i> В корзину'}
                        </button>
                        <button class="wishlist-btn" onclick="toggleWishlist(${product.id})" title="Добавить в избранное">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Добавление в корзину
async function addToCart(productId) {
    const dataService = window.dataService;
    if (!dataService || !dataService.addToCart) {
        alert('Сервис корзины не доступен');
        return;
    }
    
    const currentUser = dataService.getCurrentUser ? dataService.getCurrentUser() : null;
    
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему, чтобы добавить товары в корзину');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        await dataService.addToCart(currentUser.id, productId, 1);
        updateHeader(dataService);
        
        // Обновляем кнопку
        const button = document.querySelector(`[onclick="addToCart(${productId})"]`);
        if (button) {
            button.innerHTML = '<i class="fas fa-check"></i> В корзине';
            button.classList.add('added');
            button.disabled = true;
            
            // Через 3 секунды возвращаем возможность добавить еще
            setTimeout(() => {
                button.disabled = false;
            }, 3000);
        }
        
        showNotification('Товар добавлен в корзину!');
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении в корзину:', error);
        alert('Не удалось добавить товар в корзину');
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

function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

function showNotification(message) {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function showEmptyState() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search fa-3x"></i>
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить параметры поиска или выбрать другую категорию</p>
            <button class="btn btn-primary" onclick="resetFilters()">
                <i class="fas fa-redo"></i> Сбросить фильтры
            </button>
        </div>
    `;
}

function showErrorMessage() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle fa-3x"></i>
            <h3>Ошибка загрузки товаров</h3>
            <p>Пожалуйста, попробуйте обновить страницу</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Обновить страницу
            </button>
        </div>
    `;
}

// Фильтры, поиск, пагинация
function setupFilters() {
    const sortSelect = document.getElementById('sortSelect');
    const priceSelect = document.getElementById('priceSelect');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    if (priceSelect) {
        priceSelect.addEventListener('change', applyFilters);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Дебаунс для поиска при вводе
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 500);
        });
    }
}

function setupCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            applyFilters();
        });
    });
}

function applyFilters() {
    const selectedCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const sortValue = document.getElementById('sortSelect')?.value || 'featured';
    const priceValue = document.getElementById('priceSelect')?.value || '';
    
    console.log('🔧 Применение фильтров:', { selectedCategory, sortValue, priceValue });
    
    // Фильтрация по категории
    if (selectedCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category === selectedCategory
        );
    }
    
    // Фильтрация по цене
    if (priceValue) {
        const [min, max] = priceValue.split('-').map(Number);
        filteredProducts = filteredProducts.filter(product => {
            const price = product.price;
            if (max) {
                return price >= min && price <= max;
            } else {
                return price <= min;
            }
        });
    }
    
    // Сортировка
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => b.id - a.id);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        default:
            filteredProducts.sort((a, b) => b.reviews - a.reviews);
            break;
    }
    
    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Рендерим товары и пагинацию
    renderProducts();
    renderPagination();
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value.trim().toLowerCase() || '';
    
    console.log('🔍 Поиск:', query);
    
    if (!query) {
        applyFilters();
        return;
    }
    
    filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.features || []).some(feature => 
            feature.toLowerCase().includes(query)
        )
    );
    
    currentPage = 1;
    renderProducts();
    renderPagination();
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const priceSelect = document.getElementById('priceSelect');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'featured';
    if (priceSelect) priceSelect.value = '';
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
    
    applyFilters();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let pages = [];
    
    // Всегда показываем первую страницу
    pages.push(1);
    
    // Показываем страницы вокруг текущей
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
    }
    
    // Всегда показываем последнюю страницу
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }
    
    // Создаем HTML для пагинации
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `
            <button class="page-btn" onclick="goToPage(${currentPage - 1})" title="Предыдущая">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }
    
    let prevPage = 0;
    pages.forEach(page => {
        if (page > prevPage + 1) {
            paginationHTML += '<span class="page-dots">...</span>';
        }
        
        paginationHTML += `
            <button class="page-btn ${page === currentPage ? 'active' : ''}" 
                    onclick="goToPage(${page})">
                ${page}
            </button>
        `;
        
        prevPage = page;
    });
    
    if (currentPage < totalPages) {
        paginationHTML += `
            <button class="page-btn" onclick="goToPage(${currentPage + 1})" title="Следующая">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    // Плавная прокрутка к началу товаров
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Просмотр деталей товара
function showProductDetail(productId) {
    // В реальном приложении здесь будет переход на страницу товара
    alert('Функция быстрого просмотра в разработке. ID товара: ' + productId);
}

// Добавление в избранное
function toggleWishlist(productId) {
    const button = document.querySelector(`[onclick="toggleWishlist(${productId})"]`);
    const icon = button?.querySelector('i');
    
    if (!button || !icon) return;
    
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        icon.className = 'far fa-heart';
        showNotification('Удалено из избранного');
    } else {
        button.classList.add('active');
        icon.className = 'fas fa-heart';
        showNotification('Добавлено в избранное');
    }
}

// Экспортируем функции для глобального использования
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.showProductDetail = showProductDetail;
window.goToPage = goToPage;
window.resetFilters = resetFilters;

// Запускаем при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем магазин...');
    
    // Даем время на загрузку других скриптов
    setTimeout(() => {
        initializeShop();
    }, 100);
});