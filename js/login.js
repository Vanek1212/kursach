// js/login.js

// Ожидание загрузки DataService
async function waitForDataService() {
    return new Promise((resolve, reject) => {
        if (window.dataService && window.dataService.isInitialized) {
            console.log('✅ DataService уже инициализирован');
            resolve(window.dataService);
            return;
        }
        
        console.log('⏳ Ожидание DataService...');
        
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

// Инициализация страницы входа
async function initializeLogin() {
    console.log('🔐 Инициализация страницы входа...');
    
    try {
        // Ждем загрузки dataService
        const dataService = await waitForDataService();
        
        // Если пользователь уже авторизован, перенаправляем в профиль
        if (dataService.isAuthenticated()) {
            console.log('👤 Пользователь уже авторизован, перенаправляем в профиль');
            window.location.href = 'profile.html';
            return;
        }
        
        setupLoginForm(dataService);
        
        // Проверяем параметр URL для сообщения об успешной регистрации
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registered') === 'true') {
            showSuccess('Регистрация успешна! Теперь вы можете войти в систему.');
        }
        
        console.log('✅ Страница входа инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации страницы входа:', error);
        showError('Сервис временно недоступен. Пожалуйста, попробуйте позже.');
    }
}

// Настройка формы входа
function setupLoginForm(dataService) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Валидация
        const errors = validateLoginForm(email, password);
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        
        // Показываем индикатор загрузки
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        loginButton.disabled = true;
        
        try {
            // Пытаемся войти
            await dataService.loginUser(email, password);
            
            // Показываем сообщение об успехе
            showSuccess('Успешный вход! Перенаправляем...');
            
            // Обновляем бейдж корзины
            dataService.updateCartBadge();
            
            // Перенаправляем в профиль через 1 секунду
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
            
        } catch (error) {
            showError(error.message || 'Ошибка входа. Проверьте email и пароль.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            loginButton.innerHTML = 'Войти';
            loginButton.disabled = false;
        }
    });
}

// Валидация формы входа
function validateLoginForm(email, password) {
    const errors = [];
    
    if (!email) {
        errors.push('Введите email');
    } else if (!isValidEmail(email)) {
        errors.push('Пожалуйста, введите корректный email');
    }
    
    if (!password) {
        errors.push('Введите пароль');
    } else if (password.length < 6) {
        errors.push('Пароль должен быть не менее 6 символов');
    }
    
    return errors;
}

// Проверка email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Показать сообщение об ошибке
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (errorMessage) {
        errorMessage.innerHTML = message;
        errorMessage.classList.add('show');
    }
    
    if (successMessage) {
        successMessage.classList.remove('show');
    }
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
    }, 5000);
}

// Показать сообщение об успехе
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
    }
    
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализация страницы входа...');
    initializeLogin();
});