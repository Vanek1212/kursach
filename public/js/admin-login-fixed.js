// admin-login-fixed.js - упрощенная версия
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Admin Login Initialized');
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    // Сохраняем оригинальный обработчик
    const originalOnSubmit = loginForm.onsubmit;
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password ? '***' : 'empty');
        
        // Проверяем специальный логин администратора
        if (email === 'admin@admin.com' && password === 'admin') {
            console.log('✅ ADMIN LOGIN DETECTED');
            
            // Устанавливаем флаги администратора
            localStorage.setItem('admin_session', 'active');
            localStorage.setItem('is_admin', 'true');
            localStorage.setItem('user_email', email);
            
            // Создаем минимальный объект пользователя
            const adminUser = {
                id: '999',
                email: 'admin@admin.com',
                name: 'Администратор',
                isAdmin: true
            };
            
            localStorage.setItem('everist_currentUser', JSON.stringify(adminUser));
            
            // Показываем сообщение
            showMessage('✅ Вход выполнен как администратор!', 'success');
            
            // Через 1 секунду перенаправляем на главную страницу
            setTimeout(() => {
                console.log('🔄 Redirecting to index.html');
                window.location.href = '../index.html';
            }, 1000);
            
            return false;
        }
        
        // Если не администратор, продолжаем обычную обработку
        console.log('👤 Regular user login attempt');
        
        // Пытаемся использовать dataService если он есть
        if (window.dataService) {
            console.log('📡 Using dataService for login');
            
            // Вызываем оригинальный обработчик через dataService
            window.dataService.loginUser(email, password)
                .then(result => {
                    if (result.success) {
                        console.log('✅ User logged in via dataService');
                        // Если пользователь - администратор в базе данных
                        if (result.user && result.user.isAdmin) {
                            localStorage.setItem('admin_session', 'active');
                            localStorage.setItem('is_admin', 'true');
                            console.log('✅ User is admin in database');
                        }
                        // Перенаправление должно быть в dataService
                    } else {
                        showMessage('❌ ' + (result.error || 'Ошибка входа'), 'error');
                    }
                })
                .catch(error => {
                    console.error('❌ Login error:', error);
                    showMessage('❌ Ошибка входа через dataService', 'error');
                });
        } else {
            console.warn('⚠️ dataService not available');
            // Если нет dataService, просто перенаправляем
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 500);
        }
        
        return false;
    });
    
    function showMessage(message, type) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (type === 'error' && errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else if (type === 'success' && successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }
});