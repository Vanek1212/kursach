// js/registr.js

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

// Инициализация страницы регистрации
async function initializeRegistration() {
    console.log('📝 Инициализация страницы регистрации...');
    
    try {
        // Ждем загрузки dataService
        const dataService = await waitForDataService();
        
        // Если пользователь уже авторизован, перенаправляем в профиль
        if (dataService.isAuthenticated()) {
            console.log('👤 Пользователь уже авторизован, перенаправляем в профиль');
            window.location.href = 'profile.html';
            return;
        }
        
        setupRegistrationForm(dataService);
        setupPasswordStrengthChecker();
        
        console.log('✅ Страница регистрации инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации страницы регистрации:', error);
        showError('Сервис временно недоступен. Пожалуйста, попробуйте позже.');
    }
}

// Настройка проверки сложности пароля
function setupPasswordStrengthChecker() {
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordHint = document.getElementById('passwordHint');
    
    if (!passwordInput || !passwordStrength) return;
    
    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        let strength = 0;
        let hint = '';
        
        if (password.length >= 6) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Обновляем индикатор
        passwordStrength.className = 'strength-meter';
        if (password.length === 0) {
            passwordHint.textContent = 'Пароль должен содержать не менее 6 символов';
        } else if (strength <= 2) {
            passwordStrength.classList.add('strength-weak');
            passwordHint.textContent = 'Слабый пароль. Добавьте цифры и заглавные буквы.';
        } else if (strength <= 4) {
            passwordStrength.classList.add('strength-medium');
            passwordHint.textContent = 'Средний пароль. Можно добавить специальные символы.';
        } else {
            passwordStrength.classList.add('strength-strong');
            passwordHint.textContent = 'Сильный пароль';
        }
    });
}

// Настройка формы регистрации
function setupRegistrationForm(dataService) {
    const registerForm = document.getElementById('registerForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const phoneInput = document.getElementById('phone');
    const termsCheckbox = document.getElementById('terms');
    const registerButton = document.getElementById('registerButton');
    
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const phone = phoneInput.value.trim();
        
        // Валидация
        const errors = validateRegistrationForm(firstName, email, password, confirmPassword, termsCheckbox);
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        
        // Формируем полное имя
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        
        // Показываем индикатор загрузки
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
        registerButton.disabled = true;
        
        try {
            // Регистрируем пользователя
            const user = await dataService.registerUser(
                email,
                password,
                fullName,
                phone
            );
            
            // Показываем сообщение об успехе
            showSuccess('Регистрация успешна! Теперь вы можете войти в систему.');
            
            // Чистим форму
            registerForm.reset();
            
            // Перенаправляем на страницу входа через 2 секунды
            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 2000);
            
        } catch (error) {
            showError(error.message || 'Ошибка регистрации. Попробуйте еще раз.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            registerButton.innerHTML = 'Создать аккаунт';
            registerButton.disabled = false;
        }
    });
}

// Валидация формы регистрации
function validateRegistrationForm(firstName, email, password, confirmPassword, termsCheckbox) {
    const errors = [];
    
    if (!firstName) {
        errors.push('Введите имя');
    }
    
    if (!email) {
        errors.push('Введите email');
    } else if (!isValidEmail(email)) {
        errors.push('Введите корректный email');
    }
    
    if (password.length < 6) {
        errors.push('Пароль должен быть не менее 6 символов');
    }
    
    if (password !== confirmPassword) {
        errors.push('Пароли не совпадают');
    }
    
    if (!termsCheckbox.checked) {
        errors.push('Примите условия использования');
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
    console.log('📄 DOM загружен, инициализация страницы регистрации...');
    initializeRegistration();
});