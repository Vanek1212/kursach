// Глобальные функции для работы с корзиной
function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Проверяем, есть ли товар уже в корзине
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновляем счетчик
    loadCartCount();
    
    // Показываем уведомление
    showNotification(`${name} added to cart!`);
    
    // Обновляем отображение корзины, если находимся на странице корзины
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    loadCartCount();
    
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
}

function updateQuantity(id, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === id);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartCount();
        
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    }
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotal = document.getElementById('cartTotal');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    
    if (!cartItemsContainer) return;
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartSummary.style.display = 'none';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        return;
    }
    
    // Скрываем сообщение о пустой корзине
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    
    // Очищаем контейнер
    cartItemsContainer.innerHTML = '';
    
    let subtotal = 0;
    
    // Создаем элементы для каждого товара
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        itemElement.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="item-price">$${item.price.toFixed(2)} each</p>
            </div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <div class="item-total">$${itemTotal.toFixed(2)}</div>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        `;
        
        cartItemsContainer.appendChild(itemElement);
    });
    
    // Рассчитываем итоги
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    
    // Обновляем значения
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    cartTotal.textContent = `$${total.toFixed(2)}`;
    
    // Показываем итоги
    cartSummary.style.display = 'block';
}

function checkout() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        if (confirm('You need to login to checkout. Go to login page?')) {
            window.location.href = '/pages/login.html';
        }
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    if (confirm('Proceed to checkout?')) {
        alert('Thank you for your order! This is a demo.');
        localStorage.removeItem('cart');
        loadCartCount();
        displayCartItems();
    }
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('cart');
        loadCartCount();
        displayCartItems();
    }
}

function showNotification(message) {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Загружаем корзину при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCartCount();
    
    // Если находимся на странице корзины, отображаем товары
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
        
        // Настройка кнопки Checkout
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkout);
        }
    }
    
    // Настройка кнопок добавления в корзину на главной
    setupAddToCartButtons();
});

// Вспомогательная функция для настройки кнопок
function setupAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.id;
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
            
            addToCart(productId, productName, productPrice);
        });
    });
}

// Функция загрузки счетчика (для использования из других файлов)
function loadCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Добавляем стили для анимации уведомлений
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}