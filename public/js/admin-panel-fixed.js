// admin-panel-fixed.js - панель ТОЛЬКО после входа как админ
class AdminPanel {
    constructor() {
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isPanelVisible = false;
        this.currentTab = 'products';
        
        console.log('🛠️ AdminPanel constructor called');
        console.log('📍 Current URL:', window.location.href);
        
        // Небольшая задержка для гарантии, что DOM загружен
        setTimeout(() => this.init(), 100);
    }
    
    init() {
        console.log('🔧 Initializing Admin Panel...');
        
        // Проверяем, не на странице ли логина
        if (this.isLoginPage()) {
            console.log('⏸️ Login page detected, skipping admin panel');
            return;
        }
        
        // ПРОВЕРКА: есть ли пользователь в системе
        if (!this.hasUserLoggedIn()) {
            console.log('👤 No user logged in, admin panel not created');
            return;
        }
        
        this.checkAdmin();
        
        if (this.isAdmin) {
            console.log('✅ User is admin, creating panel');
            this.createPanel();
            this.setupEventListeners();
            this.showWelcomeNotification();
        } else {
            console.log('❌ User is not admin, panel not created');
        }
    }
    
    hasUserLoggedIn() {
        // Проверяем, вошел ли вообще какой-либо пользователь
        const userStr = localStorage.getItem('everist_currentUser');
        if (!userStr) {
            console.log('❌ No user found in localStorage');
            return false;
        }
        
        try {
            const user = JSON.parse(userStr);
            console.log('👤 Found logged in user:', user.email);
            return true;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            return false;
        }
    }
    
    isLoginPage() {
        // Получаем текущий путь
        const path = window.location.pathname.toLowerCase();
        const page = path.split('/').pop();
        
        // Проверяем, является ли страница логином
        const loginPages = [
            'login.html', 'login', 'auth.html', 'auth',
            'signin.html', 'signin', 'signup.html', 'signup'
        ];
        
        return loginPages.includes(page) || 
               path.includes('login') || 
               path.includes('auth');
    }
    
    checkAdmin() {
        console.log('🔍 Starting admin check...');
        
        // ВАЖНО: Проверяем ТОЛЬКО флаги, установленные при логине
        // Не создаем админа из ничего
        
        // 1. Проверяем основные флаги админа
        const adminSession = localStorage.getItem('admin_session');
        const isAdminFlag = localStorage.getItem('is_admin');
        const superAdminFlag = localStorage.getItem('super_admin');
        
        console.log('📊 Admin flags check:', {
            adminSession,
            isAdminFlag,
            superAdminFlag
        });
        
        // Ключевое условие: админ-сессия должна быть активна
        if (adminSession === 'active' && isAdminFlag === 'true') {
            this.isAdmin = true;
            this.isSuperAdmin = superAdminFlag === 'true';
            console.log('✅ Admin verified by active session');
            return;
        }
        
        // 2. Проверяем пользователя из everist_currentUser
        try {
            const userStr = localStorage.getItem('everist_currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log('👤 Checking user object:', user);
                
                // Проверяем явные признаки админа
                if (user.email === 'admin@admin.com') {
                    this.isAdmin = true;
                    this.isSuperAdmin = true;
                    console.log('✅ Super admin by email');
                    
                    // Устанавливаем флаги для будущих проверок
                    localStorage.setItem('admin_session', 'active');
                    localStorage.setItem('is_admin', 'true');
                    localStorage.setItem('super_admin', 'true');
                    return;
                }
                
                // Проверяем флаги в объекте пользователя
                if (user.isAdmin === true) {
                    this.isAdmin = true;
                    this.isSuperAdmin = user.isSuperAdmin === true;
                    console.log('✅ Admin by user flag');
                    
                    // Устанавливаем сессию
                    localStorage.setItem('admin_session', 'active');
                    localStorage.setItem('is_admin', 'true');
                    if (this.isSuperAdmin) {
                        localStorage.setItem('super_admin', 'true');
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
        }
        
        // 3. Если ничего не найдено - не админ
        this.isAdmin = false;
        this.isSuperAdmin = false;
        
        console.log('📋 User is NOT an admin');
    }
    
    createPanel() {
        console.log('🛠️ Creating admin panel...');
        
        // Удаляем старую панель, если она существует
        const oldPanel = document.getElementById('adminPanel');
        if (oldPanel) {
            oldPanel.remove();
            console.log('🗑️ Removed old admin panel');
        }
        
        // Получаем email пользователя
        let userEmail = 'Администратор';
        let userName = 'Администратор';
        try {
            const userStr = localStorage.getItem('everist_currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                userEmail = user.email || 'admin@admin.com';
                userName = user.name || 'Администратор';
            }
        } catch (e) {
            console.error('Error getting user data:', e);
        }
        
        const panelHTML = `
            <div id="adminPanel" class="admin-panel">
                <!-- Кнопка для открытия/закрытия -->
                <div class="admin-toggle-btn" id="adminToggleBtn" title="Админ-панель">
                    <i class="fas ${this.isSuperAdmin ? 'fa-crown' : 'fa-user-shield'}"></i>
                </div>
                
                <!-- Основное содержимое панели -->
                <div class="admin-content hidden">
                    <div class="admin-header">
                        <h3><i class="fas ${this.isSuperAdmin ? 'fa-crown' : 'fa-user-shield'}"></i> 
                            ${this.isSuperAdmin ? 'Супер-Администратор' : 'Администратор'}
                        </h3>
                        <div class="admin-controls">
                            <button id="adminCloseBtn" class="admin-close-btn" title="Закрыть">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="admin-user-info">
                        <div class="admin-user-name">
                            <i class="fas fa-user"></i>
                            <span>${userName}</span>
                        </div>
                        <div class="admin-user-email">
                            <i class="fas fa-envelope"></i>
                            <span>${userEmail}</span>
                        </div>
                    </div>
                    
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="products">
                            <i class="fas fa-box"></i> Товары
                        </button>
                        <button class="admin-tab" data-tab="users">
                            <i class="fas fa-users"></i> Пользователи
                        </button>
                        <button class="admin-tab" data-tab="add">
                            <i class="fas fa-plus"></i> Добавить
                        </button>
                    </div>
                    
                    <div class="admin-tab-content">
                        <div id="productsTab" class="tab-pane active">
                            <div class="admin-toolbar">
                                <button id="refreshProducts" class="btn-refresh">
                                    <i class="fas fa-sync"></i> Обновить
                                </button>
                                <input type="text" id="productSearch" placeholder="Поиск товаров..." class="admin-search">
                            </div>
                            <div class="table-container">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Название</th>
                                            <th>Цена</th>
                                            <th>Категория</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="productsTableBody">
                                        <tr><td colspan="5">Загрузка товаров...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div id="usersTab" class="tab-pane">
                            <div class="table-container">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Имя</th>
                                            <th>Email</th>
                                            <th>Роль</th>
                                            <th>Дата регистрации</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody">
                                        <tr><td colspan="5">Загрузка пользователей...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div id="addTab" class="tab-pane">
                            <div class="admin-form">
                                <h4><i class="fas fa-plus-circle"></i> Добавить новый товар</h4>
                                <div class="form-group">
                                    <label>Название товара:</label>
                                    <input type="text" id="newProductName" placeholder="Введите название" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Цена:</label>
                                    <input type="number" id="newProductPrice" placeholder="0.00" class="form-control" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Категория:</label>
                                    <select id="newProductCategory" class="form-control">
                                        <option value="hair">Уход за волосами</option>
                                        <option value="body">Уход за телом</option>
                                        <option value="face">Уход за лицом</option>
                                        <option value="kit">Наборы</option>
                                    </select>
                                </div>
                                <button id="addProductBtn" class="btn-add">
                                    <i class="fas fa-plus"></i> Добавить товар
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-footer">
                        <div class="admin-session-info">
                            <small><i class="fas fa-clock"></i> Вход: ${new Date().toLocaleTimeString()}</small>
                        </div>
                        <button id="adminLogoutBtn" class="btn-logout">
                            <i class="fas fa-sign-out-alt"></i> Выйти из админ-панели
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем панель в конец body
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        
        // Добавляем стили
        this.addStyles();
        
        console.log('✅ Admin panel created successfully');
    }
    
    addStyles() {
        // Проверяем, не добавлены ли стили уже
        if (document.getElementById('admin-panel-styles')) {
            return;
        }
        
        const styles = `
            /* Основные стили админ-панели */
            #adminPanel {
                position: fixed;
                top: 0;
                right: 0;
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Кнопка переключения - ВИДНА ТОЛЬКО ДЛЯ АДМИНОВ */
            .admin-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: ${this.isSuperAdmin ? 
                    'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 22px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 100000;
                transition: all 0.3s ease;
                border: 2px solid white;
            }
            
            .admin-toggle-btn:hover {
                transform: scale(1.1) rotate(10deg);
                box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            }
            
            /* Основное содержимое панели */
            .admin-content {
                position: fixed;
                top: 0;
                right: 0;
                width: 500px;
                height: 100vh;
                background: white;
                box-shadow: -5px 0 25px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                z-index: 99998;
            }
            
            .admin-content:not(.hidden) {
                transform: translateX(0);
            }
            
            /* Заголовок */
            .admin-header {
                background: ${this.isSuperAdmin ? 
                    'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                color: white;
                padding: 18px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .admin-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .admin-close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                font-size: 16px;
            }
            
            .admin-close-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: rotate(90deg);
            }
            
            /* Информация о пользователе */
            .admin-user-info {
                padding: 15px 20px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .admin-user-name, .admin-user-email {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            
            .admin-user-name i {
                color: #4a5568;
            }
            
            .admin-user-email i {
                color: #4a5568;
            }
            
            /* Вкладки */
            .admin-tabs {
                display: flex;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .admin-tab {
                flex: 1;
                padding: 14px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                color: #64748b;
                border-bottom: 3px solid transparent;
                transition: all 0.3s;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .admin-tab:hover {
                background: #f1f5f9;
                color: #475569;
            }
            
            .admin-tab.active {
                color: ${this.isSuperAdmin ? '#ee5a24' : '#667eea'};
                border-bottom-color: ${this.isSuperAdmin ? '#ee5a24' : '#667eea'};
                background: white;
                font-weight: 600;
            }
            
            /* Контент вкладок */
            .admin-tab-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f8fafc;
            }
            
            .tab-pane {
                display: none;
                height: 100%;
            }
            
            .tab-pane.active {
                display: block;
            }
            
            /* Панель инструментов */
            .admin-toolbar {
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
            }
            
            .btn-refresh {
                padding: 10px 16px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 500;
                transition: background 0.3s;
            }
            
            .btn-refresh:hover {
                background: #2563eb;
            }
            
            .admin-search {
                flex: 1;
                padding: 10px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            
            .admin-search:focus {
                outline: none;
                border-color: #3b82f6;
            }
            
            /* Таблицы */
            .table-container {
                overflow-x: auto;
                max-height: 400px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                background: white;
            }
            
            .admin-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            
            .admin-table th {
                background: #f8fafc;
                padding: 14px 16px;
                text-align: left;
                border-bottom: 2px solid #e2e8f0;
                font-weight: 600;
                color: #334155;
                position: sticky;
                top: 0;
            }
            
            .admin-table td {
                padding: 12px 16px;
                border-bottom: 1px solid #f1f5f9;
            }
            
            .admin-table tr:hover {
                background: #f8fafc;
            }
            
            /* Кнопки действий */
            .btn-action {
                padding: 6px 12px;
                margin: 0 4px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .btn-edit {
                background: #fbbf24;
                color: #78350f;
            }
            
            .btn-edit:hover {
                background: #f59e0b;
            }
            
            .btn-delete {
                background: #ef4444;
                color: white;
            }
            
            .btn-delete:hover {
                background: #dc2626;
            }
            
            /* Формы */
            .admin-form {
                background: white;
                padding: 25px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .admin-form h4 {
                margin-bottom: 20px;
                color: #1e293b;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #4a5568;
                font-size: 14px;
            }
            
            .form-control {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .form-control:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .btn-add {
                width: 100%;
                padding: 14px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: background 0.3s;
            }
            
            .btn-add:hover {
                background: #059669;
            }
            
            /* Подвал */
            .admin-footer {
                padding: 16px 20px;
                border-top: 1px solid #e2e8f0;
                background: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .admin-session-info {
                font-size: 12px;
                color: #64748b;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-logout {
                padding: 10px 20px;
                background: #64748b;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.3s;
            }
            
            .btn-logout:hover {
                background: #475569;
            }
            
            /* Уведомление при входе */
            .admin-welcome-notification {
                position: fixed;
                top: 90px;
                right: 90px;
                background: ${this.isSuperAdmin ? 
                    'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                color: white;
                padding: 14px 20px;
                border-radius: 10px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                z-index: 100001;
                animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 500;
                max-width: 300px;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
            
            /* Скрытый класс */
            .hidden {
                display: none;
            }
        `;
        
        const styleTag = document.createElement('style');
        styleTag.id = 'admin-panel-styles';
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
    }
    
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // Кнопка открытия/закрытия панели
        const toggleBtn = document.getElementById('adminToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }
        
        // Кнопка закрытия панели
        const closeBtn = document.getElementById('adminCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePanel();
            });
        }
        
        // Переключение вкладок
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Выход из админ-панели
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logoutAdmin();
            });
        }
        
        // Обновление списка товаров
        const refreshBtn = document.getElementById('refreshProducts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadProducts();
            });
        }
        
        // Добавление товара
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addProduct();
            });
        }
        
        // Поиск товаров
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
        
        console.log('✅ All event listeners setup complete');
    }
    
    showWelcomeNotification() {
        // Удаляем старое уведомление
        const oldNotice = document.querySelector('.admin-welcome-notification');
        if (oldNotice) oldNotice.remove();
        
        // Создаем новое уведомление
        const notice = document.createElement('div');
        notice.className = 'admin-welcome-notification';
        notice.innerHTML = `
            <i class="fas ${this.isSuperAdmin ? 'fa-crown' : 'fa-user-shield'}"></i>
            <div>
                <strong>Добро пожаловать в админ-панель!</strong><br>
                Вы вошли как ${this.isSuperAdmin ? 'Супер-Администратор' : 'Администратор'}
            </div>
        `;
        
        document.body.appendChild(notice);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notice.parentNode) {
                notice.remove();
            }
        }, 5000);
    }
    
    togglePanel() {
        const content = document.querySelector('.admin-content');
        if (!content) return;
        
        this.isPanelVisible = !this.isPanelVisible;
        
        if (this.isPanelVisible) {
            content.classList.remove('hidden');
            // Загружаем данные при открытии
            this.loadProducts();
            this.loadUsers();
            // Обновляем время сессии
            const sessionInfo = document.querySelector('.admin-session-info small');
            if (sessionInfo) {
                sessionInfo.innerHTML = `<i class="fas fa-clock"></i> Вход: ${new Date().toLocaleTimeString()}`;
            }
        } else {
            content.classList.add('hidden');
        }
    }
    
    hidePanel() {
        const content = document.querySelector('.admin-content');
        if (content) {
            content.classList.add('hidden');
            this.isPanelVisible = false;
        }
    }
    
    switchTab(tabName) {
        // Обновляем активные вкладки
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        // Обновляем активные панели
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        const activePane = document.getElementById(`${tabName}Tab`);
        if (activePane) activePane.classList.add('active');
        
        // Загружаем данные для активной вкладки
        if (tabName === 'products') {
            this.loadProducts();
        } else if (tabName === 'users') {
            this.loadUsers();
        }
    }
    
    logoutAdmin() {
        if (confirm('Вы уверены, что хотите выйти из админ-панели?\n\nЭто завершит вашу административную сессию.')) {
            // Удаляем только админ-флаги, но НЕ удаляем пользователя
            localStorage.removeItem('admin_session');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('super_admin');
            localStorage.removeItem('admin_permissions');
            
            // Удаляем админ-флаги из объекта пользователя
            try {
                const userStr = localStorage.getItem('everist_currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    delete user.isAdmin;
                    delete user.isSuperAdmin;
                    delete user.permissions;
                    localStorage.setItem('everist_currentUser', JSON.stringify(user));
                }
            } catch (error) {
                console.error('Error updating user:', error);
            }
            
            // Скрываем панель
            this.hidePanel();
            
            // Удаляем панель из DOM
            const panel = document.getElementById('adminPanel');
            if (panel) panel.remove();
            
            // Удаляем стили
            const styles = document.getElementById('admin-panel-styles');
            if (styles) styles.remove();
            
            alert('Вы вышли из админ-панели. Для доступа войдите как администратор.');
            
            // Обновляем страницу
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
    
    async loadProducts() {
        console.log('📦 Loading products...');
        try {
            const response = await fetch('http://localhost:3000/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const products = await response.json();
            const tbody = document.getElementById('productsTableBody');
            
            if (!tbody) {
                console.error('❌ Products table body not found');
                return;
            }
            
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">Нет товаров в базе данных</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td><strong>${product.name}</strong></td>
                    <td>$${product.price.toFixed(2)}${product.oldPrice ? `<br><small><s>$${product.oldPrice.toFixed(2)}</s></small>` : ''}</td>
                    <td><span style="padding: 4px 8px; background: #e2e8f0; border-radius: 4px;">${product.category}</span></td>
                    <td style="white-space: nowrap;">
                        <button class="btn-action btn-edit" onclick="window.adminPanelInstance.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-action btn-delete" onclick="window.adminPanelInstance.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            console.log(`✅ Loaded ${products.length} products`);
        } catch (error) {
            console.error('❌ Error loading products:', error);
            const tbody = document.getElementById('productsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" style="color: #ef4444; padding: 20px; text-align: center;">Ошибка загрузки товаров</td></tr>';
            }
        }
    }
    
    async loadUsers() {
        console.log('👥 Loading users...');
        try {
            const response = await fetch('http://localhost:3000/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const users = await response.json();
            const tbody = document.getElementById('usersTableBody');
            
            if (!tbody) {
                console.error('❌ Users table body not found');
                return;
            }
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">Нет пользователей</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const isAdmin = user.email === 'admin@admin.com' || user.isAdmin;
                const role = isAdmin ? 
                    '<span style="color: #667eea; font-weight: 600;">👑 Админ</span>' : 
                    '<span style="color: #64748b;">Пользователь</span>';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td><strong>${user.name || 'Без имени'}</strong></td>
                    <td>${user.email}</td>
                    <td>${role}</td>
                    <td>${user.registrationDate || 'Не указана'}</td>
                `;
                tbody.appendChild(row);
            });
            
            console.log(`✅ Loaded ${users.length} users`);
        } catch (error) {
            console.error('❌ Error loading users:', error);
        }
    }
    
    async addProduct() {
        const nameInput = document.getElementById('newProductName');
        const priceInput = document.getElementById('newProductPrice');
        const categorySelect = document.getElementById('newProductCategory');
        
        const name = nameInput.value.trim();
        const price = priceInput.value;
        const category = categorySelect.value;
        
        if (!name || !price) {
            alert('Пожалуйста, заполните название и цену товара');
            return;
        }
        
        try {
            // Получаем текущие товары для определения ID
            const response = await fetch('http://localhost:3000/products');
            const products = await response.json();
            const maxId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id) || 0)) : 0;
            const newId = maxId + 1;
            
            const newProduct = {
                id: newId.toString(),
                name: name,
                price: parseFloat(price),
                category: category,
                image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400",
                reviews: Math.floor(Math.random() * 50),
                rating: (Math.random() * 2 + 3).toFixed(1),
                description: "Новый товар, добавленный через админ-панель",
                volume: "100ml",
                ingredients: ["Natural Ingredients", "Eco-friendly"],
                features: ["Эко-продукт", "Безопасный состав"]
            };
            
            const addResponse = await fetch('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });
            
            if (addResponse.ok) {
                alert('✅ Товар успешно добавлен!');
                nameInput.value = '';
                priceInput.value = '';
                this.loadProducts();
                this.switchTab('products');
            }
        } catch (error) {
            console.error('❌ Error adding product:', error);
            alert('❌ Ошибка при добавлении товара');
        }
    }
    
    async editProduct(productId) {
        const newName = prompt('Введите новое название товара:', '');
        if (newName === null) return;
        
        const newPrice = prompt('Введите новую цену товара:', '');
        if (newPrice === null) return;
        
        if (!newName.trim() || !newPrice.trim()) {
            alert('Все поля должны быть заполнены');
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newName,
                    price: parseFloat(newPrice)
                })
            });
            
            if (response.ok) {
                alert('✅ Товар обновлен!');
                this.loadProducts();
            }
        } catch (error) {
            console.error('❌ Error editing product:', error);
            alert('❌ Ошибка при обновлении товара');
        }
    }
    
    async deleteProduct(productId) {
        if (!confirm(`Вы уверены, что хотите удалить товар #${productId}?\n\nЭто действие нельзя отменить.`)) return;
        
        try {
            const response = await fetch(`http://localhost:3000/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('✅ Товар удален!');
                this.loadProducts();
            }
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            alert('❌ Ошибка при удалении товара');
        }
    }
    
    searchProducts(query) {
        const rows = document.querySelectorAll('#productsTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
}

// Инициализируем админ-панель при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, checking for admin panel...');
    
    // Небольшая задержка для гарантии, что другие скрипты загрузились
    setTimeout(() => {
        console.log('🔍 Initializing Admin Panel...');
        window.adminPanelInstance = new AdminPanel();
    }, 300);
});