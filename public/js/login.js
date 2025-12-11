// js/login.js - УПРОЩЕННЫЙ

console.log('📄 login.js загружен');

// Инициализация страницы входа
async function initializeLogin() {
    console.log('🔐 Инициализация страницы входа...');
    
    try {
        // Проверяем авторизацию
        const savedUser = localStorage.getItem('everist_currentUser');
        if (savedUser) {
            console.log('👤 Пользователь уже авторизован');
            window.location.href = 'profile.html';
            return;
        }
        
        setupLoginForm();
        
        // Проверяем параметр URL для сообщения об успешной регистрации
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registered') === 'true') {
            showSuccess('Регистрация успешна! Теперь вы можете войти в систему.');
        }
        
        console.log('✅ Страница входа инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Сервис временно недоступен. Пожалуйста, попробуйте позже.');
    }
}

// Настройка формы входа
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    
    if (!loginForm) {
        console.error('❌ Форма входа не найдена');
        return;
    }
    
    console.log('✅ Форма входа найдена');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value.trim() || '';
        const password = document.getElementById('password')?.value || '';
        
        // Валидация
        const errors = validateLoginForm(email, password);
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        
        // Показываем индикатор загрузки
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
            loginButton.disabled = true;
        }
        
        try {
            console.log('🔄 Попытка входа...');
            
            // Используем DataService если он доступен, иначе напрямую через fetch
            if (window.dataService && window.dataService.loginUser) {
                const result = await window.dataService.loginUser(email, password);
                
                if (result.success) {
                    showSuccess('Успешный вход! Перенаправляем...');
                    
                    // Обновляем бейдж корзины если есть метод
                    if (window.dataService.updateCartBadge) {
                        window.dataService.updateCartBadge();
                    }
                    
                    // Перенаправляем в профиль через 1 секунду
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1000);
                } else {
                    showError(result.error || 'Ошибка входа. Проверьте email и пароль.');
                }
            } else {
                // Прямой запрос к API
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Сохраняем пользователя
                    localStorage.setItem('everist_currentUser', JSON.stringify(result.user));
                    
                    // Показываем сообщение об успехе
                    showSuccess('Успешный вход! Перенаправляем...');
                    
                    // Перенаправляем в профиль через 1 секунду
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1000);
                } else {
                    showError(result.error || 'Ошибка входа. Проверьте email и пароль.');
                }
            }
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            showError('Ошибка соединения с сервером. Пожалуйста, попробуйте позже.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            if (loginButton) {
                loginButton.innerHTML = 'Войти';
                loginButton.disabled = false;
            }
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
    
    setTimeout(() => {
        if (successMessage) {
            successMessage.classList.remove('show');
        }
    }, 3000);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализация страницы входа...');
    initializeLogin();
});