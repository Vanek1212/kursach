// login-fixed.js
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Валидация
    if (!email || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        // Прямой запрос к JSON Server
        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        
        // Ищем пользователя
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Убираем пароль
            const { password, ...userWithoutPassword } = user;
            
            // Сохраняем
            localStorage.setItem('everist_currentUser', JSON.stringify(userWithoutPassword));
            
            alert('Вход успешен!');
            window.location.href = 'profile.html';
        } else {
            alert('Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка подключения к серверу');
    }
}

// Навешиваем обработчик
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});