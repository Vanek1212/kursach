// shop.js - Версия для JSON Server
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 9;

// Основная инициализация
async function initializeShop() {
    console.log('🛍️ Инициализация магазина...');
    
    try {
        showPreloader();
        
        // Ждем загрузки DataService
        await waitForDataService();
        
        // Загружаем товары из API
        console.log('📦 Загрузка товаров из API...');
        allProducts = await window.dataService.getProducts();
        
        if (allProducts.length === 0) {
            console.warn('⚠️ Нет товаров для отображения, загружаем из локального JSON');
            // Fallback на локальный JSON
            try {
                const response = await fetch('/data/data.json');
                if (response.ok) {
                    const data = await response.json();
                    allProducts = data.products || [];
                    console.log('✅ Товары загружены из локального JSON:', allProducts.length);
                }
            } catch (jsonError) {
                console.error('❌ Ошибка загрузки JSON:', jsonError);
                allProducts = createFallbackProducts();
            }
        }
        
        if (allProducts.length === 0) {
            console.warn('⚠️ Нет товаров для отображения');
            showEmptyState();
            hidePreloader();
            return;
        }
        
        // Обрабатываем товары
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
        await updateHeader();
        await renderProducts();
        renderPagination();
        setupFilters();
        setupSearch();
        setupCategories();
        
        hidePreloader();
        
        console.log('✅ Магазин успешно инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации магазина:', error);
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
            console.log('✅ DataService готов в магазине');
            window.removeEventListener('dataServiceReady', handler);
            clearTimeout(timeout);
            resolve(window.dataService);
        };
        
        window.addEventListener('dataServiceReady', handler);
        
        const timeout = setTimeout(() => {
            console.warn('⚠️ Таймаут ожидания DataService в магазине');
            window.removeEventListener('dataServiceReady', handler);
            resolve(window.dataService);
        }, 5000);
    });
}

// Обновление заголовка
async function updateHeader() {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    
    // Получаем пользователя
    let user = null;
    let cartCount = 0;
    
    if (window.dataService && window.dataService.isAuthenticated()) {
        user = window.dataService.getCurrentUser();
        cartCount = await window.dataService.getCartItemCount();
    }
    
    let headerHTML = `
        <a href="#" class="search-icon" onclick="event.preventDefault(); document.getElementById('searchInput').focus()">
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

// Переключение корзины
async function toggleCart(productId, button) {
    console.log('🛒 Добавление/удаление товара:', productId);
    
    // Проверяем авторизацию
    if (!window.dataService || !window.dataService.isAuthenticated()) {
        showNotification('Пожалуйста, войдите в систему, чтобы управлять корзиной', 'info');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 1500);
        return;
    }
    
    try {
        // Проверяем, есть ли уже товар в корзине
        const isInCart = await window.dataService.isProductInCart(productId);
        
        if (isInCart) {
            // Удаляем из корзины
            await window.dataService.removeFromCart(productId);
            updateCartButton(button, false);
            showNotification('Товар удален из корзины', 'info');
        } else {
            // Добавляем в корзину
            await window.dataService.addToCart(productId, 1);
            updateCartButton(button, true);
            showNotification('Товар добавлен в корзину!', 'success');
        }
        
        // Обновляем заголовок
        await updateHeader();
        
        // Перерисовываем товары для обновления кнопок
        await renderProducts();
        
    } catch (error) {
        console.error('❌ Ошибка при работе с корзиной:', error);
        showNotification(error.message || 'Не удалось обновить корзину', 'error');
    }
}

// Обновление кнопки корзины
function updateCartButton(button, isInCart) {
    if (!button) return;
    
    if (isInCart) {
        button.innerHTML = '<i class="fas fa-check"></i> В корзине';
        button.classList.add('added');
        button.title = 'Нажмите, чтобы удалить из корзины';
    } else {
        button.innerHTML = '<i class="fas fa-shopping-cart"></i> В корзину';
        button.classList.remove('added');
        button.title = '';
    }
}

// Рендеринг товаров
async function renderProducts() {
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
    
    // Получаем информацию о корзине для текущего пользователя
    let cartProductIds = new Set();
    if (window.dataService && window.dataService.isAuthenticated()) {
        try {
            const cart = await window.dataService.getCart();
            cartProductIds = new Set(cart.items.map(item => item.productId));
        } catch (error) {
            console.error('❌ Ошибка загрузки корзины:', error);
        }
    }
    
    productsGrid.innerHTML = productsToShow.map(product => {
        // Проверяем, есть ли товар в корзине
        const isInCart = cartProductIds.has(product.id);
        
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
                                onclick="toggleCart(${product.id}, this)"
                                data-product-id="${product.id}">
                            ${isInCart ? 
                                '<i class="fas fa-check"></i> В корзине' : 
                                '<i class="fas fa-shopping-cart"></i> В корзину'}
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

// Вспомогательные функции (остаются без изменений)
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

function createFallbackProducts() {
    return [
        {
            id: 1,
            name: "Тестовый товар 1",
            category: "hair",
            price: 29.99,
            oldPrice: 39.99,
            image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format&fit=crop",
            rating: 4.5,
            reviews: 128,
            features: ["Натуральный", "Экологичный"],
            description: "Тестовое описание товара"
        },
        {
            id: 2,
            name: "Тестовый товар 2",
            category: "face",
            price: 45.50,
            image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400&auto=format&fit=crop",
            rating: 4.7,
            reviews: 89,
            features: ["Увлажняющий", "SPF 30"],
            description: "Тестовое описание товара"
        }
    ];
}

// Фильтры, поиск, пагинация (остаются без изменений)
function setupFilters() {
    const sortSelect = document.getElementById('sortSelect');
    const priceSelect = document.getElementById('priceSelect');
    
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    if (priceSelect) priceSelect.addEventListener('change', applyFilters);
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        
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
            categoryButtons.forEach(btn => btn.classList.remove('active'));
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
    
    if (selectedCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category === selectedCategory
        );
    }
    
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
    
    currentPage = 1;
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
    
    let pages = [1];
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
    }
    
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }
    
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
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        console.log('👋 Скрытие прелоадера...');
        
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        setTimeout(() => {
            preloader.style.display = 'none';
            console.log('✅ Прелоадер скрыт');
        }, 500);
    }
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем магазин...');
    initializeShop();
});

// Глобальные функции
window.toggleCart = toggleCart;
window.toggleWishlist = toggleWishlist;
window.showProductDetail = showProductDetail;
window.goToPage = goToPage;
window.resetFilters = resetFilters;