// Основной JavaScript файл
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, запускаем приложение...');
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Инициализация приложения Everist...');
    
    window.startTime = Date.now();
    window.minLoadingTime = 1500;
    
    initPreloader();
    
    console.log('1. Инициализация языка...');
    initLanguage(); // Первым делом инициализируем язык
    updateProgress(20);
    
    console.log('2. Инициализация доступности...');
    initAccessibility();
    updateProgress(40);
    
    console.log('3. Инициализация бургер-меню...');
    initBurgerMenu();
    updateProgress(60);
    
    console.log('4. Загрузка продуктов...');
    loadProducts();
    updateProgress(80);
    
    console.log('5. Инициализация слайдеров...');
    initSliders();
    updateProgress(90);
    
    simulateLoading();
    console.log('✅ Все модули инициализированы');
}


// ====== ПРЕЛОАДЕР ====== //
function initPreloader() {
    console.log('🔄 Инициализация прелоадера...');
    
    // Проверяем, есть ли прелоадер
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        console.error('❌ Прелоадер не найден!');
        return;
    }
    
    // Убедимся, что прелоадер видим
    preloader.style.display = 'flex';
    preloader.classList.remove('hidden');
    
    // Случайные сообщения загрузки
    const loadingMessages = [
        "Загрузка экологичных решений...",
        "Подготовка безводной формулы...",
        "Оптимизация для планеты...",
        "Создание экологичного опыта...",
        "Подключение эко-оптимистов..."
    ];
    
    // Случайное сообщение
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = randomMessage;
    }
    
    console.log('✅ Прелоадер инициализирован');
}

function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressCounter = document.getElementById('progressCounter');
    
    if (progressBar && progressCounter) {
        // Плавное изменение ширины
        progressBar.style.transition = 'width 0.3s ease';
        progressBar.style.width = percent + '%';
        progressCounter.textContent = percent + '%';
        
        // Обновляем сообщение при определенном прогрессе
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            if (percent === 30) {
                loadingText.textContent = "Настройка интерфейса...";
            } else if (percent === 60) {
                loadingText.textContent = "Оптимизация изображений...";
            } else if (percent >= 90) {
                loadingText.textContent = "Завершение загрузки...";
            }
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
            
            // Финальный шаг
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
    if (!preloader) {
        console.error('❌ Прелоадер не найден для скрытия');
        return;
    }
    
    // Добавляем класс с анимацией скрытия
    preloader.classList.add('fade-out');
    
    // Ждем окончания анимации и скрываем
    setTimeout(() => {
        preloader.classList.add('hidden');
        preloader.style.display = 'none';
        console.log('✅ Прелоадер скрыт');
        
        // Восстанавливаем прокрутку страницы
        document.body.style.overflow = '';
        
        // Показываем приветственное сообщение
        showWelcomeMessage();
    }, 500);
}

function showWelcomeMessage() {
    // Создаем элемент уведомления
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
    
    // Стили для уведомления
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
    
    // Добавляем стили анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOutUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        .welcome-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .welcome-icon {
            font-size: 24px;
        }
        
        .welcome-text {
            display: flex;
            flex-direction: column;
        }
        
        .welcome-text strong {
            font-size: 14px;
            margin-bottom: 2px;
        }
        
        .welcome-text small {
            font-size: 12px;
            opacity: 0.9;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
        if (style.parentNode) {
            style.remove();
        }
    }, 3000);
}

// ====== БУРГЕР-МЕНЮ ====== //
function initBurgerMenu() {
    console.log('🍔 Инициализация бургер-меню...');
    
    const burgerMenu = document.getElementById('burgerMenu');
    const navLinks = document.getElementById('navLinks');
    
    // Проверяем существование элементов
    if (!burgerMenu) {
        console.error('❌ Элемент с id="burgerMenu" не найден!');
        console.log('💡 Проверьте HTML: должен быть элемент с id="burgerMenu"');
        return;
    }
    
    if (!navLinks) {
        console.error('❌ Элемент с id="navLinks" не найден!');
        console.log('💡 Проверьте HTML: должен быть элемент с id="navLinks"');
        return;
    }
    
    console.log('✅ Элементы бургер-меню найдены');
    
    // Функция переключения меню
    function toggleMenu() {
        const isOpening = !navLinks.classList.contains('active');
        
        // Переключаем классы
        burgerMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Блокируем/разблокируем прокрутку
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            console.log('📱 Меню ОТКРЫТО');
        } else {
            document.body.style.overflow = '';
            console.log('📱 Меню ЗАКРЫТО');
        }
    }
    
    // Обработчик клика по бургер-меню
    burgerMenu.addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        console.log('🖱️ Клик по бургер-меню');
        toggleMenu();
    });
    
    // Закрываем меню при клике на ссылку
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            console.log('🔗 Клик по ссылке, закрываем меню');
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Закрываем меню при клике вне его области
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navLinks.contains(event.target);
        const isClickOnBurger = burgerMenu.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnBurger && navLinks.classList.contains('active')) {
            console.log('🌍 Клик вне меню, закрываем');
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Закрываем меню при нажатии ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            console.log('⎋ Нажата ESC, закрываем меню');
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Закрываем меню при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            console.log('🖥️ Размер окна > 768px, закрываем меню');
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    console.log('✅ Бургер-меню инициализировано');
}

// ====== ПАНЕЛЬ ДОСТУПНОСТИ ====== //
function initAccessibility() {
    console.log('♿ Инициализация панели доступности...');
    
    // Загружаем сохраненные настройки
    loadAccessibilitySettings();
    
    // Настраиваем кнопки размера шрифта
    const fontSizeButtons = document.querySelectorAll('.accessibility-btn[data-size]');
    fontSizeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const size = e.currentTarget.dataset.size;
            setFontSize(size);
        });
    });
    
    // Кнопка переключения темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleTheme();
        });
    }
    
    // Кнопка переключения языка
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            toggleLanguage();
        });
    }
    
    // Кнопка сброса настроек
    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetAccessibilitySettings();
        });
    }
    
    // Настраиваем скрытие панели при скролле
    setupScrollBehavior();
    
    console.log('✅ Панель доступности инициализирована');
}

function loadAccessibilitySettings() {
    console.log('📂 Загрузка сохраненных настроек...');
    
    // Загружаем размер шрифта
    const savedFontSize = localStorage.getItem('everist_font_size') || 'medium';
    console.log(`Размер шрифта из хранилища: ${savedFontSize}`);
    setFontSize(savedFontSize, false);
    
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log(`Тема из хранилища: ${savedTheme}`);
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
    
    // Загружаем язык
    const savedLang = localStorage.getItem('language') || 'ru';
    console.log(`Язык из хранилища: ${savedLang}`);
    updateLangButton(savedLang);
}

function setFontSize(size, showNotification = true) {
    console.log(`🎯 Установка размера шрифта: ${size}`);
    
    // Убираем все классы размера шрифта
    document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    
    // Добавляем новый класс
    document.body.classList.add('font-' + size);
    
    // Обновляем активные кнопки
    const fontSizeButtons = document.querySelectorAll('.accessibility-btn[data-size]');
    fontSizeButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.size === size) {
            button.classList.add('active');
        }
    });
    
    // Сохраняем в localStorage
    localStorage.setItem('everist_font_size', size);
    
    if (showNotification) {
        showAccessibilityNotification(`Размер шрифта: ${getFontSizeLabel(size)}`);
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
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log(`🎨 Переключение темы: ${currentTheme} → ${newTheme}`);
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
    
    showAccessibilityNotification(`Тема: ${newTheme === 'dark' ? 'Темная' : 'Светлая'}`);
}

function updateThemeIcons(theme) {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    
    const icons = button.querySelectorAll('.theme-icon');
    if (!icons || icons.length < 2) return;
    
    console.log(`🔄 Обновление иконок темы для: ${theme}`);
    
    if (theme === 'dark') {
        // Показываем солнце (чтобы переключить на светлую)
        icons[0].style.display = 'block';
        icons[0].style.opacity = '1';
        icons[1].style.display = 'none';
        icons[1].style.opacity = '0';
    } else {
        // Показываем луну (чтобы переключить на темную)
        icons[0].style.display = 'none';
        icons[0].style.opacity = '0';
        icons[1].style.display = 'block';
        icons[1].style.opacity = '1';
    }
}

function toggleLanguage() {
    const currentLang = document.documentElement.getAttribute('lang') || 'ru';
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    
    console.log(`🌐 Переключение языка: ${currentLang} → ${newLang}`);
    
    document.documentElement.setAttribute('lang', newLang);
    localStorage.setItem('language', newLang);
    updateLangButton(newLang);
    translatePage(newLang);
    
    showAccessibilityNotification(`Язык: ${newLang === 'ru' ? 'Русский' : 'English'}`);
}

function updateLangButton(lang) {
    const button = document.getElementById('langToggle');
    if (!button) return;
    
    const icon = button.querySelector('.lang-icon');
    if (!icon) return;
    
    icon.textContent = lang === 'ru' ? 'EN' : 'RU';
}

function resetAccessibilitySettings() {
    if (confirm('Сбросить все настройки доступности?')) {
        console.log('🔄 Сброс настроек доступности...');
        
        localStorage.removeItem('everist_font_size');
        localStorage.removeItem('theme');
        localStorage.removeItem('language');
        
        // Сбрасываем к стандартным настройкам
        setFontSize('medium', false);
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcons('light');
        document.documentElement.setAttribute('lang', 'ru');
        updateLangButton('ru');
        translatePage('ru');
        
        showAccessibilityNotification('Настройки сброшены');
    }
}

function setupScrollBehavior() {
    const panel = document.querySelector('.accessibility-panel');
    if (!panel) return;
    
    let lastScrollY = window.scrollY;
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY;
        
        if (isScrollingDown && currentScrollY > 100) {
            panel.classList.add('hidden');
        } else if (!isScrollingDown || currentScrollY < 50) {
            panel.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
        
        scrollTimeout = setTimeout(() => {
            panel.classList.remove('hidden');
        }, 1500);
    });
}

function showAccessibilityNotification(message) {
    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.accessibility-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = 'accessibility-notification';
    notification.textContent = message;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ====== ПЕРЕВОД СТРАНИЦЫ ====== //
// ====== ПЕРЕВОД СТРАНИЦЫ ====== //
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'ru';
    document.documentElement.setAttribute('lang', savedLang);
    
    // Ждем полной загрузки DOM перед переводом
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            translatePage(savedLang);
        });
    } else {
        translatePage(savedLang);
    }
    
    console.log(`🌐 Язык установлен: ${savedLang === 'ru' ? 'Русский' : 'English'}`);
}

function translatePage(lang) {
    console.log(`🌐 Перевод страницы на: ${lang === 'ru' ? 'русский' : 'английский'}`);
    
    const translations = {
        ru: {
            // Header and navigation
            'SHOP': 'МАГАЗИН',
            'LEARN': 'О ПРОДУКТЕ',
            'SUSTAINABILITY': 'ЭКОЛОГИЧНОСТЬ',
            'OUR STORY': 'О НАС',
            'PRESS': 'ПРЕССА',
            'QUIZ': 'ТЕСТ',
            
            // Hero section - полный текст заголовка
            'Find Your Shower Routine (& Receive a Free Gift!)': 'Найдите свой уход (& Получите Подарок!)',
            'Find Your Shower<br>Routine (& Receive<br>a Free Gift!)': 'Найдите свой уход (& Получите Подарок!)',
            
            // Hero subtitle
            'Discover waterless haircare that works': 'Откройте для себя безводный уход за волосами, который работает',
            
            // Products section
            'Loved by thousands of eco-optimists': 'Любим тысячами эко-оптимистов',
            'Waterless Shampoo Concentrate': 'Концентрат безводного шампуня',
            'Waterless Conditioner Concentrate': 'Концентрат кондиционера',
            'Holiday Wellness Kit': 'Праздничный набор',
            
            // Reviews
            '85 Reviews': '85 Отзывов',
            '10 Reviews': '10 Отзывов',
            'Reviews': 'Отзывы',
            
            // Product badges
            'BESTSELLER': 'БЕСТСЕЛЛЕР',
            'NEW': 'НОВИНКА',
            
            // Buttons
            'SHOP NOW': 'КУПИТЬ СЕЙЧАС',
            'ADD TO CART': 'ДОБАВИТЬ В КОРЗИНУ',
            'SHOP HAIR+BODY': 'КУПИТЬ УХОД ЗА ВОЛОСАМИ+ТЕЛОМ',
            
            // Testimonials
            '"I wasn\'t prepared for how much healthier my hair is. I get compliments all the time now!"': 
            '"Я не ожидала, насколько здоровее станут мои волосы. Теперь я постоянно получаю комплименты!"',
            
            // Water info section
            'THOSE PLASTIC BOTTLES IN YOUR SHOWER?': 'ЭТИ ПЛАСТИКОВЫЕ БУТЫЛКИ В ВАШЕМ ДУШЕ?',
            '70% water': '70% воды',
            'water': 'воды',
            'Water-activated pastes': 'Водоактивируемые пасты',
            'Plastic free': 'Без пластика',
            'Vegan': 'Веганский',
            'Cruelty-free': 'Без жестокости',
            'Silicone-free': 'Без силиконов',
            
            // Water description
            'Introducing the first, patent-pending waterless concentrates for hair and body. 3x concentrated pastes that are packed with good for hair and skin ingredients and activated by the water in your shower. We fit a whole bottle into a 100ml, travel-friendly, aluminum tube.': 
            'Представляем первые безводные концентраты для волос и тела с патентом. В 3 раза более концентрированные пасты, наполненные полезными ингредиентами для волос и кожи, активируются водой в вашем душе. Мы поместили целую бутылку в 100-миллилитровую, удобную для путешествий алюминиевую тубу.',
            
            // Features
            'High Performance': 'Высокая эффективность',
            'Super Clean': 'Супер чистый',
            'Made for Eco-Optimists': 'Создано для эко-оптимистов',
            'There\'s a reason people say it\'s the best shampoo they\'ve ever used.': 'Есть причина, по которой люди говорят, что это лучший шампунь, который они когда-либо использовали.',
            'Ingredients matter. Here\'s what you will (and won\'t) find in Everist products.': 'Ингредиенты имеют значение. Вот что вы найдете (и не найдете) в продуктах Everist.',
            'We make choices with the planet in mind. Here\'s how we\'ve approached it.': 'Мы принимаем решения, думая о планете. Вот как мы подошли к этому.',
            
            // Big Idea sections
            'THE BIG IDEA': 'ОСНОВНАЯ ИДЕЯ',
            'Waterless': 'Без воды',
            'We asked ourselves, why are we paying to ship heavy, plastic bottles of (mostly) water around the world, when we are already showering in water?': 
            'Мы спросили себя: зачем нам платить за перевозку тяжелых пластиковых бутылок с (в основном) водой по всему миру, когда мы уже принимаем душ в воде?',
            'By removing added water from our formulas, we can create cutting edge formulas that are ultra clean, plant-based and leave your hair and skin happy and healthy.': 
            'Убрав добавленную воду из наших формул, мы можем создавать передовые формулы, которые являются ультрачистыми, растительными и делают ваши волосы и кожу счастливыми и здоровыми.',
            'One of the many reasons to go waterless.': 'Одна из многих причин перейти на безводный уход.',
            
            // Performance section
            'It works, we pinky promise.': 'Это работает, обещаем на мизинчик.',
            'We know that if your personal care products don\'t make your hair and skin feel amazing, nothing else matters. We have high expectations of our hair and body care and our formulas won\'t disappoint. From a deep cleansing lather to our signature fresh scent, we\'ve captured the sensorial shower experience you love.':
            'Мы знаем, что если ваши средства по уходу не делают ваши волосы и кожу потрясающими, ничто другое не имеет значения. У нас высокие ожидания от ухода за волосами и телом, и наши формулы не разочаруют. От глубоко очищающей пены до нашего фирменного свежего аромата — мы воплотили сенсорный опыт душа, который вы любите.',
            
            // Super Clean section
            'Always clean, as it should be.': 'Всегда чистые, как и должно быть.',
            'By removing the water from our formulas, Everist products can be formulated to a new standard of clean. Everist products are plant-based, vegan and cruelty-free as well as being free-from sulfates, silicones, dyes and synthetic fragrances. No small feat.':
            'Убрав воду из наших формул, продукты Everist могут быть созданы по новому стандарту чистоты. Продукты Everist являются растительными, веганскими и не тестируются на животных, а также не содержат сульфатов, силиконов, красителей и синтетических ароматизаторов. Не маленькая задача.',
            
            // Eco Optimists section
            'It\'s the future of beauty.': 'Это будущее красоты.',
            'Our products are thoughtfully designed, inside and out, as is the way we do business. Everist products are single-use plastic free (our tubes are pure 100% recycled aluminum) and we take our caps back through our CapBack program. We also use biodegradable ingredients for our formulas and produce with the smallest carbon footprint possible (which is then offset, to be certified carbon neutral).':
            'Наши продукты продуманы до мелочей, как внутри, так и снаружи, как и то, как мы ведем бизнес. Продукты Everist не содержат одноразового пластика (наши тубы изготовлены из чистого 100% переработанного алюминия), и мы забираем наши крышки обратно через нашу программу CapBack. Мы также используем биоразлагаемые ингредиенты для наших формул и производим с наименьшим возможным углеродным следом (который затем компенсируется для сертификации углеродной нейтральности).',
            
            // User Testimonials
            'What Our Community Says': 'Что говорит наше сообщество',
            
            // Vision section
            'OUR VISION': 'НАША ВИЗИЯ',
            'Eco for Everyone': 'Экология для всех',
            'We all want to live more sustainably. We\'re here to make it easier.': 'Мы все хотим жить более устойчиво. Мы здесь, чтобы облегчить это.',
            'We believe that big change happens when small changes become easy and better (in every way) than the status quo. Eco can be for everyone and we\'re here to prove it. Imperfect environmentalists welcome.':
            'Мы считаем, что большие изменения происходят, когда небольшие изменения становятся легкими и лучше (во всех отношениях), чем статус-кво. Экология может быть для всех, и мы здесь, чтобы доказать это. Неидеальные экологи приветствуются.',
            'JOIN THE MOVEMENT': 'ПРИСОЕДИНИТЬСЯ К ДВИЖЕНИЮ',
            
            // Footer
            'Helpful Links': 'Полезные ссылки',
            'Community': 'Сообщество',
            'Contact Us': 'Связаться с нами',
            'Join our eco-optimist community': 'Присоединяйтесь к нашему сообществу эко-оптимистов',
            'FAQ': 'ЧАВО',
            'HELP CENTER': 'ЦЕНТР ПОМОЩИ',
            'CAP BACK': 'ВОЗВРАТ КРЫШЕК',
            'SHIPPING POLICY': 'ПОЛИТИКА ДОСТАВКИ',
            'RETURN POLICY': 'ПОЛИТИКА ВОЗВРАТА',
            'PRIVACY POLICY': 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
            'TERMS': 'УСЛОВИЯ',
            'SEARCH': 'ПОИСК',
            'REVIEWS': 'ОТЗЫВЫ',
            'PRESS': 'ПРЕССА',
            'INSTAGRAM': 'ИНСТАГРАМ',
            'TIKTOK': 'ТИК-ТОК',
            'FACEBOOK': 'ФЕЙСБУК',
            'BECOME A RETAIL PARTNER': 'СТАТЬ РОЗНИЧНЫМ ПАРТНЕРОМ',
            'BECOME AN AFFILIATE': 'СТАТЬ АФФИЛИАТОМ',
            'BECOME AN AMBASSADOR': 'СТАТЬ АМБАССАДОРОМ',
            'Ask us anything.': 'Спрашивайте о чем угодно.',
            'Your email address': 'Ваш email адрес',
            'SUBSCRIBE': 'ПОДПИСАТЬСЯ',
            'CONTACT FORM': 'ФОРМА ОБРАТНОЙ СВЯЗИ',
            
            // Footer bottom
            '© 2023, Everist. All rights reserved.': '© 2023, Everist. Все права защищены.',
            
            // Accessibility panel
            'Decrease font size': 'Уменьшить шрифт',
            'Standard font size': 'Стандартный шрифт',
            'Increase font size': 'Увеличить шрифт',
            'Larger font size': 'Сильно увеличить шрифт',
            'Switch language': 'Переключить язык',
            'Switch theme': 'Переключить тему',
            'Reset settings': 'Сбросить настройки'
        },
        en: {
            // Russian translations back to English
            'МАГАЗИН': 'SHOP',
            'О ПРОДУКТЕ': 'LEARN',
            'ЭКОЛОГИЧНОСТЬ': 'SUSTAINABILITY',
            'О НАС': 'OUR STORY',
            'ПРЕССА': 'PRESS',
            'ТЕСТ': 'QUIZ',
            
            'Найдите свой уход (& Получите Подарок!)': 'Find Your Shower Routine (& Receive a Free Gift!)',
            
            'Откройте для себя безводный уход за волосами, который работает': 'Discover waterless haircare that works',
            
            'Любим тысячами эко-оптимистов': 'Loved by thousands of eco-optimists',
            'Концентрат безводного шампуня': 'Waterless Shampoo Concentrate',
            'Концентрат кондиционера': 'Waterless Conditioner Concentrate',
            'Праздничный набор': 'Holiday Wellness Kit',
            
            '85 Отзывов': '85 Reviews',
            '10 Отзывов': '10 Reviews',
            'Отзывы': 'Reviews',
            
            'БЕСТСЕЛЛЕР': 'BESTSELLER',
            'НОВИНКА': 'NEW',
            
            'КУПИТЬ СЕЙЧАС': 'SHOP NOW',
            'ДОБАВИТЬ В КОРЗИНУ': 'ADD TO CART',
            'КУПИТЬ УХОД ЗА ВОЛОСАМИ+ТЕЛОМ': 'SHOP HAIR+BODY',
            
            '"Я не ожидала, насколько здоровее станут мои волосы. Теперь я постоянно получаю комплименты!"': 
            '"I wasn\'t prepared for how much healthier my hair is. I get compliments all the time now!"',
            
            'ЭТИ ПЛАСТИКОВЫЕ БУТЫЛКИ В ВАШЕМ ДУШЕ?': 'THOSE PLASTIC BOTTLES IN YOUR SHOWER?',
            '70% воды': '70% water',
            'воды': 'water',
            'Водоактивируемые пасты': 'Water-activated pastes',
            'Без пластика': 'Plastic free',
            'Веганский': 'Vegan',
            'Без жестокости': 'Cruelty-free',
            'Без силиконов': 'Silicone-free',
            
            'Представляем первые безводные концентраты для волос и тела с патентом. В 3 раза более концентрированные пасты, наполненные полезными ингредиентами для волос и кожи, активируются водой в вашем душе. Мы поместили целую бутылку в 100-миллилитровую, удобную для путешествий алюминиевую тубу.':
            'Introducing the first, patent-pending waterless concentrates for hair and body. 3x concentrated pastes that are packed with good for hair and skin ingredients and activated by the water in your shower. We fit a whole bottle into a 100ml, travel-friendly, aluminum tube.',
            
            'Высокая эффективность': 'High Performance',
            'Супер чистый': 'Super Clean',
            'Создано для эко-оптимистов': 'Made for Eco-Optimists',
            'Есть причина, по которой люди говорят, что это лучший шампунь, который они когда-либо использовали.': 'There\'s a reason people say it\'s the best shampoo they\'ve ever used.',
            'Ингредиенты имеют значение. Вот что вы найдете (и не найдете) в продуктах Everist.': 'Ingredients matter. Here\'s what you will (and won\'t) find in Everist products.',
            'Мы принимаем решения, думая о планете. Вот как мы подошли к этому.': 'We make choices with the planet in mind. Here\'s how we\'ve approached it.',
            
            'ОСНОВНАЯ ИДЕЯ': 'THE BIG IDEA',
            'Без воды': 'Waterless',
            'Мы спросили себя: зачем нам платить за перевозку тяжелых пластиковых бутылок с (в основном) водой по всему миру, когда мы уже принимаем душ в воде?':
            'We asked ourselves, why are we paying to ship heavy, plastic bottles of (mostly) water around the world, when we are already showering in water?',
            'Убрав добавленную воду из наших формул, мы можем создавать передовые формулы, которые являются ультрачистыми, растительными и делают ваши волосы и кожу счастливыми и здоровыми.':
            'By removing added water from our formulas, we can create cutting edge formulas that are ultra clean, plant-based and leave your hair and skin happy and healthy.',
            'Одна из многих причин перейти на безводный уход.': 'One of the many reasons to go waterless.',
            
            'Это работает, обещаем на мизинчик.': 'It works, we pinky promise.',
            'Мы знаем, что если ваши средства по уходу не делают ваши волосы и кожу потрясающими, ничто другое не имеет значения. У нас высокие ожидания от ухода за волосами и телом, и наши формулы не разочаруют. От глубоко очищающей пены до нашего фирменного свежего аромата — мы воплотили сенсорный опыт душа, который вы любите.':
            'We know that if your personal care products don\'t make your hair and skin feel amazing, nothing else matters. We have high expectations of our hair and body care and our formulas won\'t disappoint. From a deep cleansing lather to our signature fresh scent, we\'ve captured the sensorial shower experience you love.',
            
            'Всегда чистые, как и должно быть.': 'Always clean, as it should be.',
            'Убрав воду из наших формул, продукты Everist могут быть созданы по новому стандарту чистоты. Продукты Everist являются растительными, веганскими и не тестируются на животных, а также не содержат сульфатов, силиконов, красителей и синтетических ароматизаторов. Не маленькая задача.':
            'By removing the water from our formulas, Everist products can be formulated to a new standard of clean. Everist products are plant-based, vegan and cruelty-free as well as being free-from sulfates, silicones, dyes and synthetic fragrances. No small feat.',
            
            'Это будущее красоты.': 'It\'s the future of beauty.',
            'Наши продукты продуманы до мелочей, как внутри, так и снаружи, как и то, как мы ведем бизнес. Продукты Everist не содержат одноразового пластика (наши тубы изготовлены из чистого 100% переработанного алюминия), и мы забираем наши крышки обратно через нашу программу CapBack. Мы также используем биоразлагаемые ингредиенты для наших формул и производим с наименьшим возможным углеродным следом (который затем компенсируется для сертификации углеродной нейтральности).':
            'Our products are thoughtfully designed, inside and out, as is the way we do business. Everist products are single-use plastic free (our tubes are pure 100% recycled aluminum) and we take our caps back through our CapBack program. We also use biodegradable ingredients for our formulas and produce with the smallest carbon footprint possible (which is then offset, to be certified carbon neutral).',
            
            'Что говорит наше сообщество': 'What Our Community Says',
            
            'НАША ВИЗИЯ': 'OUR VISION',
            'Экология для всех': 'Eco for Everyone',
            'Мы все хотим жить более устойчиво. Мы здесь, чтобы облегчить это.': 'We all want to live more sustainably. We\'re here to make it easier.',
            'Мы считаем, что большие изменения происходят, когда небольшие изменения становятся легкими и лучше (во всех отношениях), чем статус-кво. Экология может быть для всех, и мы здесь, чтобы доказать это. Неидеальные экологи приветствуются.':
            'We believe that big change happens when small changes become easy and better (in every way) than the status quo. Eco can be for everyone and we\'re here to prove it. Imperfect environmentalists welcome.',
            'ПРИСОЕДИНИТЬСЯ К ДВИЖЕНИЮ': 'JOIN THE MOVEMENT',
            
            'Полезные ссылки': 'Helpful Links',
            'Сообщество': 'Community',
            'Связаться с нами': 'Contact Us',
            'Присоединяйтесь к нашему сообществу эко-оптимистов': 'Join our eco-optimist community',
            'ЧАВО': 'FAQ',
            'ЦЕНТР ПОМОЩИ': 'HELP CENTER',
            'ВОЗВРАТ КРЫШЕК': 'CAP BACK',
            'ПОЛИТИКА ДОСТАВКИ': 'SHIPPING POLICY',
            'ПОЛИТИКА ВОЗВРАТА': 'RETURN POLICY',
            'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ': 'PRIVACY POLICY',
            'УСЛОВИЯ': 'TERMS',
            'ПОИСК': 'SEARCH',
            'ОТЗЫВЫ': 'REVIEWS',
            'ПРЕССА': 'PRESS',
            'ИНСТАГРАМ': 'INSTAGRAM',
            'ТИК-ТОК': 'TIKTOK',
            'ФЕЙСБУК': 'FACEBOOK',
            'СТАТЬ РОЗНИЧНЫМ ПАРТНЕРОМ': 'BECOME A RETAIL PARTNER',
            'СТАТЬ АФФИЛИАТОМ': 'BECOME AN AFFILIATE',
            'СТАТЬ АМБАССАДОРОМ': 'BECOME AN AMBASSADOR',
            'Спрашивайте о чем угодно.': 'Ask us anything.',
            'Ваш email адрес': 'Your email address',
            'ПОДПИСАТЬСЯ': 'SUBSCRIBE',
            'ФОРМА ОБРАТНОЙ СВЯЗИ': 'CONTACT FORM',
            
            '© 2023, Everist. Все права защищены.': '© 2023, Everist. All rights reserved.',
            
            // Accessibility panel
            'Уменьшить шрифт': 'Decrease font size',
            'Стандартный шрифт': 'Standard font size',
            'Увеличить шрифт': 'Increase font size',
            'Сильно увеличить шрифт': 'Larger font size',
            'Переключить язык': 'Switch language',
            'Переключить тему': 'Switch theme',
            'Сбросить настройки': 'Reset settings'
        }
    };
    
    const langTranslations = translations[lang] || translations['en'];
    
    // Функция для поиска и замены текста
    function translateText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.nodeValue.trim();
            if (originalText && langTranslations[originalText]) {
                node.nodeValue = node.nodeValue.replace(originalText, langTranslations[originalText]);
                return true;
            }
            
            // Пробуем также без начальных и конечных пробелов
            const trimmedText = originalText.replace(/\s+/g, ' ').trim();
            if (trimmedText && trimmedText !== originalText && langTranslations[trimmedText]) {
                node.nodeValue = langTranslations[trimmedText];
                return true;
            }
        } 
        else if (node.nodeType === Node.ELEMENT_NODE) {
            // Переводим атрибуты
            ['title', 'placeholder', 'alt'].forEach(attr => {
                if (node.hasAttribute(attr)) {
                    const attrValue = node.getAttribute(attr);
                    if (attrValue && langTranslations[attrValue]) {
                        node.setAttribute(attr, langTranslations[attrValue]);
                    }
                }
            });
            
            // Обрабатываем особые случаи для заголовков с <br>
            if (node.classList && node.classList.contains('hero-title')) {
                const originalHTML = node.innerHTML;
                const normalizedHTML = originalHTML.replace(/\s+/g, ' ').trim();
                if (langTranslations[normalizedHTML]) {
                    node.innerHTML = langTranslations[normalizedHTML];
                }
            }
            
            // Обрабатываем дочерние элементы рекурсивно
            for (let i = 0; i < node.childNodes.length; i++) {
                translateText(node.childNodes[i]);
            }
        }
        return false;
    }
    
    // Основной цикл перевода - проходим несколько раз для всех элементов
    let elementsTranslated = 0;
    
    // Первый проход: основные элементы
    const selectors = [
        'a', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'button', 'label', 'strong', 'em', 'li', 'div',
        '.hero-title', '.hero-subtitle', '.product-title',
        '.product-badge', '.section-title', '.section-subtitle',
        '.feature-desc', '.quote', '.author', '.water-percentage',
        '.feature', '.btn', '.footer-section h4', '.footer-section p',
        '.footer-section a', '.newsletter p'
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            if (translateText(element)) {
                elementsTranslated++;
            }
        });
    });
    
    // Второй проход: все текстовые узлы в body
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        const originalText = node.nodeValue.trim();
        if (originalText && langTranslations[originalText]) {
            node.nodeValue = langTranslations[originalText];
            elementsTranslated++;
        }
    }
    
    console.log(`🌐 Переведено элементов: ${elementsTranslated}`);
    
    // Обновляем кнопку переключения языка
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        const langIcon = langToggle.querySelector('.lang-icon');
        if (langIcon) {
            langIcon.textContent = lang === 'ru' ? 'EN' : 'RU';
        }
    }
    
    // Обновляем заголовок документа
    document.title = lang === 'ru' ? 'Everist - Безводный уход за волосами' : 'Everist - Waterless Haircare';
}

// ====== ПРОДУКТЫ И КОРЗИНА ====== //
async function loadProducts() {
    try {
        console.log('🛍️ Загрузка продуктов...');
        const response = await fetch('data/products.json');
        const data = await response.json();
        displayProducts(data.products);
        console.log('✅ Продукты загружены из JSON');
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        console.log('🔄 Использую резервные данные...');
        
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
    if (!grid) {
        console.warn('❌ Контейнер productsGrid не найден');
        return;
    }
    
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
    
    console.log(`✅ Отображено ${products.length} товаров`);
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    showAccessibilityNotification('Товар добавлен в корзину!');
    console.log(`🛒 Товар ${productId} добавлен в корзину`);
}

// ====== СЛАЙДЕРЫ ====== //
function initSliders() {
    console.log('🔄 Инициализация слайдеров...');
    createSlider('.awards-slider', '.award-item');
    createSlider('.testimonials-slider', '.testimonial-item');
    createSlider('.certificates-slider', '.certificate-item');
    console.log('✅ Слайдеры инициализированы');
}

function createSlider(containerSelector, itemSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`❌ Слайдер: Контейнер ${containerSelector} не найден`);
        return null;
    }
    
    // Находим нужные элементы внутри контейнера
    let grid;
    if (containerSelector.includes('awards')) {
        grid = container.querySelector('.awards-grid');
    } else if (containerSelector.includes('testimonials')) {
        grid = container.querySelector('.testimonials-grid');
    } else if (containerSelector.includes('certificates')) {
        grid = container.querySelector('.certificates-grid');
    }
    
    if (!grid) {
        console.warn(`❌ Слайдер: Grid в ${containerSelector} не найден`);
        return;
    }
    
    const items = grid.querySelectorAll(itemSelector);
    const prevBtn = container.querySelector('.slider-btn.prev');
    const nextBtn = container.querySelector('.slider-btn.next');
    
    if (items.length === 0) {
        console.warn(`❌ Слайдер: Элементы ${itemSelector} не найдены`);
        return;
    }
    
    console.log(`✅ Слайдер ${containerSelector}: ${items.length} элементов`);
    
    let currentIndex = 0;
    const totalItems = items.length;
    
    // Получаем отступ между элементами
    const gridStyle = getComputedStyle(grid);
    const gap = parseInt(gridStyle.gap) || 0;
    
    // Рассчитываем ширину элемента с учетом gap
    let itemWidth = items[0].offsetWidth;
    if (itemWidth === 0) {
        itemWidth = items[0].scrollWidth || 280;
    }
    itemWidth += gap;
    
    // Рассчитываем сколько элементов видно одновременно
    const containerWidth = container.offsetWidth;
    const visibleItems = Math.max(1, Math.floor(containerWidth / itemWidth));
    
    // Функция для обновления позиции
    function updatePosition() {
        const translateX = -currentIndex * itemWidth;
        grid.style.transform = `translateX(${translateX}px)`;
        
        // Обновляем состояние кнопок
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex >= totalItems - visibleItems;
            nextBtn.style.opacity = currentIndex >= totalItems - visibleItems ? '0.5' : '1';
        }
    }
    
    // Переход к следующему элементу
    function nextSlide() {
        if (currentIndex < totalItems - visibleItems) {
            currentIndex++;
            updatePosition();
        }
    }
    
    // Переход к предыдущему элементу
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            updatePosition();
        }
    }
    
    // Свайп мышкой
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    
    grid.addEventListener('mousedown', (e) => {
        isDragging = true;
        startPos = e.clientX;
        prevTranslate = currentTranslate;
        grid.style.cursor = 'grabbing';
        grid.style.transition = 'none';
        e.preventDefault();
    });
    
    grid.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const currentPosition = e.clientX;
        currentTranslate = prevTranslate + currentPosition - startPos;
        grid.style.transform = `translateX(${currentTranslate}px)`;
    });
    
    grid.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        grid.style.cursor = 'grab';
        grid.style.transition = 'transform 0.3s ease-in-out';
        
        // Определяем направление свайпа
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -50 && currentIndex < totalItems - visibleItems) {
            nextSlide();
        } else if (movedBy > 50 && currentIndex > 0) {
            prevSlide();
        } else {
            updatePosition();
        }
    });
    
    grid.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            updatePosition();
        }
    });
    
    // Для мобильных устройств (тач-события)
    grid.addEventListener('touchstart', (e) => {
        isDragging = true;
        startPos = e.touches[0].clientX;
        prevTranslate = currentTranslate;
        grid.style.transition = 'none';
    }, { passive: true });
    
    grid.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentPosition = e.touches[0].clientX;
        currentTranslate = prevTranslate + currentPosition - startPos;
        grid.style.transform = `translateX(${currentTranslate}px)`;
    }, { passive: true });
    
    grid.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        grid.style.transition = 'transform 0.3s ease-in-out';
        
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -50 && currentIndex < totalItems - visibleItems) {
            nextSlide();
        } else if (movedBy > 50 && currentIndex > 0) {
            prevSlide();
        } else {
            updatePosition();
        }
    });
    
    // Кнопки навигации
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    // Инициализация
    updatePosition();
    
    // Обработка изменения размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Пересчитываем видимые элементы
            const newVisibleItems = Math.max(1, Math.floor(container.offsetWidth / itemWidth));
            if (currentIndex > totalItems - newVisibleItems) {
                currentIndex = Math.max(0, totalItems - newVisibleItems);
            }
            updatePosition();
        }, 250);
    });
}

// ====== ГЛОБАЛЬНЫЕ ФУНКЦИИ И ОБРАБОТЧИКИ ====== //
window.addToCart = addToCart;

// Добавляем глобальные функции для отладки
window.everist = {
    resetSettings: resetAccessibilitySettings,
    setFontSize: setFontSize,
    toggleTheme: toggleTheme,
    toggleLanguage: toggleLanguage,
    getSettings: function() {
        return {
            fontSize: localStorage.getItem('everist_font_size') || 'medium',
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'ru'
        };
    }
};

// Обработчик ошибок загрузки
window.addEventListener('error', function(e) {
    console.error('❌ Ошибка загрузки:', e);
    // Принудительно скрываем прелоадер при ошибке через 3 секунды
    setTimeout(hidePreloader, 3000);
});

// Обработчик для минимального времени загрузки
window.addEventListener('load', function() {
    const elapsedTime = Date.now() - window.startTime;
    const remainingTime = window.minLoadingTime - elapsedTime;
    
    if (remainingTime > 0) {
        console.log(`⏳ Минимальное время загрузки: ждем еще ${remainingTime}мс`);
    }
});

console.log('✅ Everist App: Скрипт загружен и готов к работе');
// ====== ОБЩИЕ ФУНКЦИИ ДЛЯ ВСЕХ СТРАНИЦ ====== //

// Функция проверки авторизации
function checkAuth() {
    const currentUser = window.dataService?.getCurrentUser();
    const authLinks = document.querySelectorAll('[data-auth]');
    
    authLinks.forEach(link => {
        if (currentUser) {
            if (link.dataset.auth === 'hide-if-auth') {
                link.style.display = 'none';
            }
            if (link.dataset.auth === 'show-if-auth') {
                link.style.display = 'block';
            }
        } else {
            if (link.dataset.auth === 'hide-if-auth') {
                link.style.display = 'block';
            }
            if (link.dataset.auth === 'show-if-auth') {
                link.style.display = 'none';
            }
        }
    });
}

// Функция обновления бейджа корзины на всех страницах
function updateCartBadgeGlobal() {
    const currentUser = window.dataService?.getCurrentUser();
    const badge = document.getElementById('cartBadge');
    
    if (badge && currentUser) {
        const count = window.dataService.getCartItemCount(currentUser.id);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuth();
    
    // Обновляем бейдж корзины
    if (window.dataService) {
        window.dataService.updateCartBadge();
    }
    
    // Для главной страницы - загружаем товары
    if (document.querySelector('.products-grid')) {
        loadProducts();
    }
});

// Функция для главной страницы
function loadProducts() {
    try {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;
        
        // Получаем 3 популярных товара
        const products = window.dataService?.getAllProducts() || [];
        const popularProducts = products
            .sort((a, b) => b.reviews - a.reviews)
            .slice(0, 3);
        
        // Отображаем товары
        popularProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div class="reviews">
                        <div class="stars">${'★'.repeat(5)}</div>
                        <span>${product.reviews} Reviews</span>
                    </div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">
                        <span class="current-price">$${product.price}</span>
                        ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ''}
                    </p>
                    <button class="btn btn-outline" onclick="addToCartMain(${product.id})">
                        ADD TO CART
                    </button>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
    }
}

// Функция добавления в корзину с главной страницы
window.addToCartMain = function(productId) {
    const currentUser = window.dataService?.getCurrentUser();
    
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему, чтобы добавить товары в корзину');
        window.location.href = 'pages/login.html';
        return;
    }
    
    try {
        window.dataService.addToCart(currentUser.id, productId, 1);
        window.dataService.updateCartBadge();
        alert('Товар добавлен в корзину!');
    } catch (error) {
        alert('Ошибка при добавлении в корзину');
    }
};