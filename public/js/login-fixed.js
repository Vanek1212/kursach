// login-fixed.js - универсальный с проверкой администратора
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Универсальная система логина загружена');
    
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    // Проверяем, не вошли ли мы уже как администратор
    checkExistingAdminSession();
    
    form.addEventListener('submit', handleLogin);
});

function checkExistingAdminSession() {
    // Если уже есть активная админ-сессия, предлагаем выйти
    if (localStorage.getItem('admin_session') === 'active' || 
        localStorage.getItem('is_admin') === 'true') {
        
        console.log('⚠️ Обнаружена активная админ-сессия');
        
        // Добавляем сообщение на страницу логина
        const loginContainer = document.querySelector('.login-container, form');
        if (loginContainer) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'admin-warning';
            warningDiv.innerHTML = `
                <div style="
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    font-size: 14px;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Обнаружена активная сессия администратора</strong>
                    <p style="margin: 8px 0 0 0;">
                        Если вы хотите войти как обычный пользователь, 
                        <a href="#" id="clearAdminSession" style="color: #856404; text-decoration: underline;">
                            завершите админ-сессию
                        </a>
                    </p>
                </div>
            `;
            
            loginContainer.parentNode.insertBefore(warningDiv, loginContainer);
            
            document.getElementById('clearAdminSession').addEventListener('click', function(e) {
                e.preventDefault();
                clearAdminSession();
                warningDiv.remove();
            });
        }
    }
}

function clearAdminSession() {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('super_admin');
    alert('Админ-сессия завершена. Теперь вы можете войти как обычный пользователь.');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Валидация
    if (!email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    submitBtn.disabled = true;
    
    try {
        // ПРОВЕРКА НА СУПЕР-АДМИНИСТРАТОРА (хардкод)
        if (email === 'admin@admin.com' && password === 'admin') {
            console.log('✅ Супер-администратор обнаружен');
            
            // Создаем объект супер-администратора
            const superAdminUser = {
                id: '999',
                email: 'admin@admin.com',
                name: 'Супер-Администратор',
                isAdmin: true,
                isSuperAdmin: true,
                permissions: ['all']
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('everist_currentUser', JSON.stringify(superAdminUser));
            
            // Устанавливаем все возможные флаги администратора
            setAdminFlags('admin@admin.com', true);
            
            showMessage('✅ Вход выполнен как Супер-Администратор!', 'success');
            
            // Перенаправление с небольшой задержкой
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            
            return;
        }
        
        // Проверка пользователя в базе данных
        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        
        // Ищем пользователя
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Убираем пароль из объекта
            const { password, ...userWithoutPassword } = user;
            
            // Проверяем, является ли пользователь администратором
            const isUserAdmin = user.email === 'admin@admin.com' || 
                               user.isAdmin === true || 
                               user.role === 'admin';
            
            // Добавляем флаг isAdmin к объекту пользователя
            const userToStore = {
                ...userWithoutPassword,
                isAdmin: isUserAdmin
            };
            
            // Сохраняем пользователя
            localStorage.setItem('everist_currentUser', JSON.stringify(userToStore));
            
            // Если пользователь администратор, устанавливаем дополнительные флаги
            if (isUserAdmin) {
                setAdminFlags(user.email, false);
                showMessage('✅ Вход выполнен как администратор!', 'success');
                
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showMessage('✅ Вход успешен!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            }
            
        } else {
            // Проверка на альтернативные учетные данные администратора
            if (checkAlternativeAdminCredentials(email, password)) {
                return; // Обработка происходит внутри функции
            } else {
                showMessage('❌ Неверный email или пароль', 'error');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('❌ Ошибка подключения к серверу', 'error');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

function setAdminFlags(email, isSuperAdmin = false) {
    // Устанавливаем все возможные флаги для однозначной идентификации администратора
    localStorage.setItem('admin_session', 'active');
    localStorage.setItem('is_admin', 'true');
    localStorage.setItem('user_email', email);
    
    if (isSuperAdmin) {
        localStorage.setItem('super_admin', 'true');
        localStorage.setItem('admin_permissions', 'all');
    }
    
    // Дополнительный флаг для обратной совместимости
    localStorage.setItem('everist_isAdmin', 'true');
    
    console.log('✅ Установлены флаги администратора для:', email);
}

function checkAlternativeAdminCredentials(email, password) {
    // Дополнительные жестко заданные учетные данные администратора
    const adminCredentials = [
        { email: 'admin@everist.com', password: 'admin123', name: 'Администратор Everist' },
        { email: 'super@admin.com', password: 'super123', name: 'Супервайзер' }
    ];
    
    const adminCred = adminCredentials.find(cred => 
        cred.email === email && cred.password === password
    );
    
    if (adminCred) {
        console.log('✅ Альтернативный администратор обнаружен');
        
        const adminUser = {
            id: Date.now().toString(),
            email: adminCred.email,
            name: adminCred.name,
            isAdmin: true,
            isSuperAdmin: false
        };
        
        localStorage.setItem('everist_currentUser', JSON.stringify(adminUser));
        setAdminFlags(adminCred.email, false);
        
        showMessage(`✅ Вход выполнен как ${adminCred.name}!`, 'success');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
        
        return true;
    }
    
    return false;
}

function showMessage(message, type) {
    // Удаляем старые сообщения
    const oldMessages = document.querySelectorAll('.login-message');
    oldMessages.forEach(msg => msg.remove());
    
    // Создаем элемент сообщения
    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const bgColor = type === 'success' ? '#d4edda' : '#f8d7da';
    const textColor = type === 'success' ? '#155724' : '#721c24';
    const borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
    
    messageDiv.innerHTML = `
        <div style="
            padding: 12px 16px;
            margin: 15px 0;
            border-radius: 6px;
            background: ${bgColor};
            color: ${textColor};
            border: 1px solid ${borderColor};
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="fas ${icon}"></i>
            ${message}
        </div>
    `;
    
    // Вставляем сообщение перед формой
    const form = document.getElementById('loginForm');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    }
    
    // Автоматически скрываем ошибки через 5 секунд
    if (type === 'error') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Функция для проверки админ-статуса (может использоваться на других страницах)
window.checkAdminStatus = function() {
    const checks = [
        localStorage.getItem('admin_session') === 'active',
        localStorage.getItem('is_admin') === 'true',
        localStorage.getItem('super_admin') === 'true'
    ];
    
    // Проверка по данным пользователя
    try {
        const userStr = localStorage.getItem('everist_currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            checks.push(
                user.isAdmin === true,
                user.isSuperAdmin === true,
                user.email === 'admin@admin.com'
            );
        }
    } catch (e) {
        console.error('Ошибка при проверке пользователя:', e);
    }
    
    return checks.some(check => check === true);
};

// Функция для выхода из системы (может использоваться на других страницах)
window.logoutUser = function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Очищаем ВСЕ связанные данные
        const keys = [
            'everist_currentUser',
            'admin_session',
            'is_admin',
            'super_admin',
            'user_email',
            'admin_permissions',
            'everist_isAdmin'
        ];
        
        keys.forEach(key => localStorage.removeItem(key));
        
        // Редирект на главную
        window.location.href = 'index.html';
    }
};

// Добавляем CSS стили для сообщений
const style = document.createElement('style');
style.textContent = `
    .login-message {
        transition: all 0.3s ease;
    }
    
    .admin-warning {
        animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .fa-spinner {
        margin-right: 8px;
    }
`;
document.head.appendChild(style);