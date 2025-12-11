document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerLink = document.getElementById('registerLink');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', showRegistration);
    }
    
    // Проверяем корзину
    if (typeof loadCartCount === 'function') {
        loadCartCount();
    }
});

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // Сброс ошибок
    if (emailError) emailError.style.display = 'none';
    if (passwordError) passwordError.style.display = 'none';
    
    // Простая валидация
    let isValid = true;
    
    if (!validateEmail(email)) {
        if (emailError) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
        }
        isValid = false;
    }
    
    if (password.length < 6) {
        if (passwordError) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordError.style.display = 'block';
        }
        isValid = false;
    }
    
    if (isValid) {
        // В реальном приложении здесь был бы запрос к серверу
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        
        // Показываем уведомление
        if (typeof showNotification === 'function') {
            showNotification('Login successful!');
        } else {
            alert('Login successful!');
        }
        
        // Перенаправляем на главную
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
}

function showRegistration() {
    alert('Registration form would appear here. For demo, you can login with any email and password (min 6 chars).');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Функция выхода
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    
    if (typeof showNotification === 'function') {
        showNotification('Logged out successfully');
    }
    
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 1000);
}