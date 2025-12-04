// js/shop.js - Логика для страницы магазина

// Глобальные переменные магазина
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 9;

// Основная функция инициализации магазина
async function initializeShop() {
    console.log('🛍️ Инициализация магазина...');
    
    try {
        // Ждем загрузку dataService
        if (!window.dataService) {
            console.error('❌ DataService не найден');
            
            // Пробуем загрузить вручную
            await loadDataService();
        }
        
        // Проверяем авторизацию
        const currentUser = window.dataService?.getCurrentUser();
        console.log('👤 Текущий пользователь:', currentUser?.email || 'Не авторизован');
        
        // Обновляем header
        updateHeader(currentUser);
        
        // Загружаем товары
        await loadProducts();
        
        // Настраиваем фильтры
        setupFilters();
        
        // Настраиваем поиск
        setupSearch();
        
        // Настраиваем категории
        setupCategories();
        
        // Инициализируем preloader
        initializePreloader();
        
        console.log('✅ Магазин успешно инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации магазина:', error);
        showErrorMessage();
    }
}

// Загрузка DataService
async function loadDataService() {
    return new Promise((resolve) => {
        const checkDataService = setInterval(() => {
            if (window.dataService) {
                clearInterval(checkDataService);
                resolve(window.dataService);
            }
        }, 100);
        
        // Таймаут 5 секунд
        setTimeout(() => {
            clearInterval(checkDataService);
            if (!window.dataService) {
                console.error('❌ DataService не загрузился за 5 секунд');
                showErrorMessage();
            }
        }, 5000);
    });
}

// Обновление header
function updateHeader(user) {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) {
        console.warn('⚠️ Элемент headerRight не найден');
        return;
    }
    
    let cartCount = 0;
    if (user && window.dataService) {
        cartCount = window.dataService.getCartItemCount(user.id);
    }
    
    if (user) {
        headerRight.innerHTML = `
            <a href="#" class="search-icon">🔍</a>
            <a href="profile.html" class="user-icon" title="${user.email}">
                ${user.name?.split(' ')[0] || user.email || '👤'}
            </a>
            <a href="cart.html" class="cart-icon">
                🛒
                <span class="cart-badge" style="${cartCount > 0 ? 'display: flex' : 'display: none'}">
                    ${cartCount}
                </span>
            </a>
        `;
    } else {
        headerRight.innerHTML = `
            <a href="#" class="search-icon">🔍</a>
            <a href="login.html" class="user-icon">👤</a>
            <a href="cart.html" class="cart-icon">
                🛒
                <span class="cart-badge" style="display: none">0</span>
            </a>
        `;
    }
}

// Загрузка товаров
async function loadProducts() {
    try {
        console.log('📦 Загрузка товаров...');
        
        if (!window.dataService || !window.dataService.getAllProducts) {
            throw new Error('DataService не инициализирован');
        }
        
        allProducts = window.dataService.getAllProducts();
        console.log(`✅ Загружено товаров: ${allProducts.length}`);
        
        // Преобразуем цены в числа
        allProducts = allProducts.map(product => ({
            ...product,
            price: parseFloat(product.price),
            oldPrice: product.oldPrice ? parseFloat(product.oldPrice) : null
        }));
        
        filteredProducts = [...allProducts];
        
        // Скрываем preloader
        hidePreloader();
        
        renderProducts();
        renderPagination();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        showErrorMessage();
    }
}

// Рендеринг товаров
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    // Рассчитываем индексы для текущей страницы
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры поиска или выберите другую категорию</p>
                <button class="btn btn-primary" onclick="resetFilters()">
                    Сбросить фильтры
                </button>
            </div>
        `;
        return;
    }
    
    const currentUser = window.dataService?.getCurrentUser();
    const userCart = currentUser ? window.dataService.getCartItems(currentUser.id) : [];
    
    productsGrid.innerHTML = productsToShow.map(product => {
        const isInCart = userCart.some(item => item.productId === product.id);
        const oldPrice = product.oldPrice;
        const currentPrice = product.price;
        const hasDiscount = oldPrice && oldPrice > currentPrice;
        const discountPercent = hasDiscount 
            ? Math.round((oldPrice - currentPrice) / oldPrice * 100)
            : 0;
        
        // Определяем бейдж
        let badge = '';
        if (hasDiscount && discountPercent > 0) {
            badge = `<div class="product-badge sale">-${discountPercent}%</div>`;
        } else if (product.reviews < 20) {
            badge = `<div class="product-badge new">NEW</div>`;
        } else if (product.reviews > 80) {
            badge = `<div class="product-badge">BESTSELLER</div>`;
        }
        
        // Исправляем путь к изображению
        const imagePath = product.image || '../img/placeholder.jpg';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${badge}
                
                <div class="product-image">
                    <img src="${imagePath}" alt="${product.name}" 
                         onerror="this.src='../img/placeholder.jpg'">
                    <div class="quick-view" onclick="showProductDetail(${product.id})">
                        Быстрый просмотр
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="product-category">
                        ${getCategoryName(product.category)}
                    </div>
                    
                    <h3 class="product-name" title="${product.name}">
                        ${product.name}
                    </h3>
                    
                    <p class="product-description" title="${product.description}">
                        ${product.description}
                    </p>
                    
                    <div class="product-price">
                        <span class="current-price">$${currentPrice.toFixed(2)}</span>
                        ${hasDiscount ? `
                            <span class="old-price">$${oldPrice.toFixed(2)}</span>
                        ` : ''}
                    </div>
                    
                    <div class="product-reviews">
                        <div class="stars">${getStarRating(product.rating || product.reviews)}</div>
                        <span class="review-count">${product.reviews || 0} отзывов</span>
                    </div>
                    
                    <div class="product-features">
                        ${(product.features || []).slice(0, 2).map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                    
                    <div class="product-actions">
                        <button class="add-to-cart-btn ${isInCart ? 'added' : ''}" 
                                onclick="addToCart(${product.id})" 
                                ${!currentUser ? 'disabled' : ''}>
                            ${isInCart ? '✓ В корзине' : 'В корзину'}
                        </button>
                        
                        <button class="wishlist-btn" onclick="toggleWishlist(${product.id})">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Рендеринг пагинации
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
    
    // Добавляем многоточия
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `
            <button class="page-btn" onclick="goToPage(${currentPage - 1})">
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
            <button class="page-btn" onclick="goToPage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Настройка фильтров
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

// Настройка поиска
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
            searchTimeout = setTimeout(performSearch, 300);
        });
    }
}

// Настройка категорий
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

// Применение фильтров
function applyFilters() {
    const selectedCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const sortValue = document.getElementById('sortSelect')?.value || 'featured';
    const priceValue = document.getElementById('priceSelect')?.value || '';
    
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
            // Предполагаем, что товары с большими ID - новее
            filteredProducts.sort((a, b) => b.id - a.id);
            break;
        case 'rating':
            // Сортируем по количеству отзывов (популярности)
            filteredProducts.sort((a, b) => b.reviews - a.reviews);
            break;
        case 'featured':
        default:
            // По умолчанию - популярные товары
            filteredProducts.sort((a, b) => b.reviews - a.reviews);
            break;
    }
    
    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Рендерим товары и пагинацию
    renderProducts();
    renderPagination();
}

// Выполнение поиска
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value.trim().toLowerCase() || '';
    
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

// Сброс фильтров
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

// Переход на страницу
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    // Прокручиваем к началу товаров
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Добавление в корзину
async function addToCart(productId) {
    const currentUser = window.dataService?.getCurrentUser();
    
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему, чтобы добавить товары в корзину');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Добавляем товар в корзину
        await window.dataService.addToCart(currentUser.id, productId, 1);
        
        // Обновляем бейдж в header
        window.dataService.updateCartBadge();
        
        // Обновляем кнопку на "В корзине"
        const button = document.querySelector(`[onclick="addToCart(${productId})"]`);
        if (button) {
            button.textContent = '✓ В корзине';
            button.classList.add('added');
            button.disabled = true;
            
            // Возвращаем исходный текст через 3 секунды
            setTimeout(() => {
                button.textContent = 'В корзине';
            }, 3000);
        }
        
        // Показываем уведомление
        showNotification('Товар добавлен в корзину!');
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении в корзину:', error);
        alert('Не удалось добавить товар в корзину');
    }
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

// Просмотр деталей товара
function showProductDetail(productId) {
    // В реальном приложении здесь будет переход на страницу товара
    alert('Функция быстрого просмотра в разработке. ID товара: ' + productId);
}

// Показ уведомления
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Инициализация preloader
function initializePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    // Скрываем preloader через 1 секунду
    setTimeout(() => {
        hidePreloader();
    }, 1000);
}

// Скрытие preloader
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300);
    }
}

// Показ ошибки
function showErrorMessage() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки товаров</h3>
            <p>Пожалуйста, попробуйте обновить страницу или зайти позже</p>
            <button class="btn btn-primary" onclick="location.reload()">
                Обновить страницу
            </button>
        </div>
    `;
}

// Получение названия категории
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

// Получение звездного рейтинга
function getStarRating(reviews) {
    // Простой способ показать рейтинг по количеству отзывов
    const rating = Math.min(5, Math.max(1, Math.floor(reviews / 20) || 3));
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM загружен, инициализация магазина...');
    await initializeShop();
});

// Экспортируем функции для глобального использования
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.showProductDetail = showProductDetail;
window.goToPage = goToPage;
window.resetFilters = resetFilters;