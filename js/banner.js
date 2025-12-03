// js/banner.js

class TopBanner {
    constructor() {
        this.banner = document.querySelector('.top-banner');
        this.closeBtn = document.querySelector('.banner-close');
        this.storageKey = 'everist_banner_closed';
        
        this.init();
    }
    
    init() {
        // Проверяем, закрывали ли уже баннер
        if (this.isClosed()) {
            this.hideBanner();
            return;
        }
        
        // Назначаем обработчик клика
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Автоматическое закрытие через 10 секунд (опционально)
        setTimeout(() => {
            if (this.banner && this.banner.style.display !== 'none') {
                this.close();
            }
        }, 10000);
    }
    
    isClosed() {
        sessionStorage.getItem(this.storageKey) === 'true';
    }
    
    close() {
        // Плавное скрытие
        if (this.banner) {
            this.banner.style.transition = 'opacity 0.3s, height 0.3s';
            this.banner.style.opacity = '0';
            this.banner.style.height = '0';
            this.banner.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.banner.style.display = 'none';
            }, 300);
        }
        
        // Сохраняем в localStorage
        sessionStorage.setItem(this.storageKey, 'true');

        
        // Отправляем событие (можно использовать для аналитики)
        this.dispatchEvent('bannerClosed');
    }
    
    hideBanner() {
        if (this.banner) {
            this.banner.style.display = 'none';
        }
    }
    
    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
    
    // Функция для сброса (если нужно показать снова)
    reset() {
        localStorage.removeItem(this.storageKey);
        if (this.banner) {
            this.banner.style.display = 'flex';
            this.banner.style.opacity = '1';
            this.banner.style.height = '24px';
        }
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.everistBanner = new TopBanner();
});