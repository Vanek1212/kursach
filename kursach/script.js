// Основной JavaScript файл
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Скрываем прелоадер
    setTimeout(() => {
        document.querySelector('.preloader').style.display = 'none';
    }, 1000);

    // Инициализация всех модулей
    initTheme();
    initLanguage();
    initAccessibility();
    initBurgerMenu();
    loadProducts();
    initResetButton();
}

// Смена темы
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton(currentTheme);

    themeToggle.addEventListener('click', function() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });
}

function updateThemeButton(theme) {
    const button = document.getElementById('themeToggle');
    button.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Смена языка
function initLanguage() {
    const langToggle = document.getElementById('langToggle');
    const currentLang = localStorage.getItem('language') || 'ru';
    
    document.documentElement.lang = currentLang;
    updateLanguageButton(currentLang);

    langToggle.addEventListener('click', function() {
        const newLang = document.documentElement.lang === 'ru' ? 'en' : 'ru';
        document.documentElement.lang = newLang;
        localStorage.setItem('language', newLang);
        updateLanguageButton(newLang);
        translatePage(newLang);
    });
}

function updateLanguageButton(lang) {
    const button = document.getElementById('langToggle');
    button.textContent = lang === 'ru' ? 'EN' : 'RU';
}

function translatePage(lang) {
    // Простой перевод ключевых элементов
    const translations = {
        ru: {
            'Find Your Shower Routine (& Receive a Free Gift!)': 'Найдите свой уход (& Получите Подарок!)',
            'Найти свой уход': 'Find Your Routine',
            'Наши бестселлеры': 'Our Bestsellers',
            'Что говорят наши клиенты': 'Customer Reviews'
        },
        en: {
            'Найдите свой уход (& Получите Подарок!)': 'Find Your Shower Routine (& Receive a Free Gift!)',
            'Find Your Routine': 'Найти свой уход',
            'Our Bestsellers': 'Наши бестселлеры',
            'Customer Reviews': 'Что говорят наши клиенты'
        }
    };

    // Обновляем текст на странице
    document.querySelectorAll('h1, h2, h3, p, span, a, button').forEach(element => {
        const text = element.textContent.trim();
        if (translations[lang] && translations[lang][text]) {
            element.textContent = translations[lang][text];
        }
    });
}

// Версия для слабовидящих
function initAccessibility() {
    const accessibilityToggle = document.getElementById('accessibilityToggle');
    const isAccessibility = localStorage.getItem('accessibility') === 'true';
    
    if (isAccessibility) {
        document.body.classList.add('accessibility-mode');
    }

    accessibilityToggle.addEventListener('click', function() {
        document.body.classList.toggle('accessibility-mode');
        localStorage.setItem('accessibility', document.body.classList.contains('accessibility-mode'));
    });
}

// Бургер-меню
function initBurgerMenu() {
    const burgerMenu = document.getElementById('burgerMenu');
    const nav = document.querySelector('.nav');

    burgerMenu.addEventListener('click', function() {
        nav.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    });
}

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        displayProducts(data.products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        // Fallback данные
        const fallbackProducts = [
            {
                id: 1,
                name: "Waterless Shampoo Paste",
                price: 24.00,
                oldPrice: 26.00,
                image: "shampoo.jpg",
                reviews: 85
            },
            {
                id: 2,
                name: "Conditioner Concentrate", 
                price: 24.00,
                oldPrice: null,
                image: "conditioner.jpg",
                reviews: 10
            },
            {
                id: 3,
                name: "Holiday Kit",
                price: 46.00,
                oldPrice: 48.00,
                image: "kit.jpg",
                reviews: 32
            }
        ];
        displayProducts(fallbackProducts);
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card fade-in">
            <div class="product-image"></div>
            <h3>${product.name}</h3>
            <div class="product-price">
                $${product.price}
                ${product.oldPrice ? `<span class="product-old-price">$${product.oldPrice}</span>` : ''}
            </div>
            <div class="product-reviews">${product.reviews} Reviews</div>
            <button class="btn-primary" onclick="addToCart(${product.id})">В корзину</button>
        </div>
    `).join('');
}

// Корзина
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Показываем уведомление
    showNotification('Товар добавлен в корзину!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Сброс настроек
function initResetButton() {
    const resetButton = document.getElementById('resetSettings');
    resetButton.addEventListener('click', function() {
        localStorage.clear();
        location.reload();
    });
}