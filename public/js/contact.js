// Обработка формы контактов
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Простая валидация
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            if (!name || !email || !message) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }
            
            // Здесь обычно отправка формы на сервер
            // Для демонстрации просто покажем сообщение
            
            // Создаем сообщение об успехе
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <strong>Спасибо!</strong> Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.
                </div>
            `;
            
            // Вставляем сообщение после формы
            contactForm.parentNode.insertBefore(successMessage, contactForm.nextSibling);
            
            // Очищаем форму
            contactForm.reset();
            
            // Плавно прокручиваем к сообщению
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Убираем сообщение через 5 секунд
            setTimeout(() => {
                successMessage.remove();
            }, 5000);
        });
    }
});