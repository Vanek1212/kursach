// js/lang.js
class Translator {
  constructor() {
    this.lang = localStorage.getItem('language') || 'ru';
    this.translations = {};
  }

  async init() {
    // Загружаем переводы
    await this.loadTranslations(this.lang);
    
    // Переводим страницу
    this.translatePage();
    
    // Настраиваем кнопки переключения
    this.setupLanguageSwitchers();
  }

  async loadTranslations(lang) {
    const response = await fetch(`translates/${lang}.json`);
    this.translations = await response.json();
    localStorage.setItem('language', lang);
  }

  translatePage() {
    // Находим все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);
      
      if (translation) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.translator = new Translator();
  window.translator.init();
});
