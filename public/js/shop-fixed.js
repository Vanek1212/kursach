// shop-fixed.js - для кнопок добавления в корзину
async function addToCart(productId) {
    const userData = localStorage.getItem('everist_currentUser');
    if (!userData) {
        alert('Войдите в систему');
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    try {
        const response = await fetch('http://localhost:3000/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                productId: productId,
                quantity: 1
            })
        });
        
        if (response.ok) {
            alert('Товар добавлен в корзину!');
            updateCartBadge();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка добавления');
    }
}

async function updateCartBadge() {
    const userData = localStorage.getItem('everist_currentUser');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    
    try {
        const response = await fetch(`http://localhost:3000/api/cart/user/${user.id}`);
        if (response.ok) {
            const cart = await response.json();
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            const badge = document.querySelector('.cart-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка обновления бейджа:', error);
    }
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('everist_currentUser')) {
        updateCartBadge();
    }
});