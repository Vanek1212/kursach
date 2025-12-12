class AdminPanel {
    constructor() {
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isPanelVisible = false;
        this.currentTab = 'products';
        
        console.log('🛠️ AdminPanel constructor called');
        
        // Добавляем проверку на текущую страницу
        this.checkPageContext();
        
        // Небольшая задержка для гарантии, что DOM загружен
        setTimeout(() => this.init(), 100);
    }
    
    checkPageContext() {
        // Если мы на странице логина, не создаем панель
        const isLoginPage = window.location.pathname.includes('login') || 
                           window.location.pathname.includes('auth');
        
        if (isLoginPage) {
            console.log('⏸️ Login page detected, admin panel will not initialize here');
            return false;
        }
        return true;
    }
    
    checkAdmin() {
        console.log('🔍 Checking admin status...');
        
        // 1. Проверяем единые флаги
        const adminSession = localStorage.getItem('admin_session');
        const isAdminFlag = localStorage.getItem('is_admin');
        
        console.log('📊 Admin check from localStorage:', {
            adminSession,
            isAdminFlag,
            superAdmin: localStorage.getItem('super_admin')
        });
        
        if (adminSession === 'active' && isAdminFlag === 'true') {
            this.isAdmin = true;
            this.isSuperAdmin = localStorage.getItem('super_admin') === 'true';
            console.log('✅ Admin verified by localStorage flags');
            return;
        }
        
        // 2. Проверяем через AuthService если он есть
        if (window.authService && window.authService.isAdminLoggedIn) {
            this.isAdmin = window.authService.isAdminLoggedIn();
            if (this.isAdmin) {
                console.log('✅ Admin verified by AuthService');
                return;
            }
        }
        
        // 3. Фолбэк проверка по пользователю
        try {
            const userStr = localStorage.getItem('everist_currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                
                if (user.email === 'admin@admin.com' || 
                    user.isAdmin === true || 
                    user.isSuperAdmin === true ||
                    user.role === 'admin') {
                    
                    this.isAdmin = true;
                    this.isSuperAdmin = user.isSuperAdmin === true;
                    
                    // Обновляем флаги для согласованности
                    localStorage.setItem('admin_session', 'active');
                    localStorage.setItem('is_admin', 'true');
                    if (this.isSuperAdmin) {
                        localStorage.setItem('super_admin', 'true');
                    }
                    
                    console.log('✅ Admin verified by user data');
                }
            }
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
        }
        
        console.log('📋 Final admin status:', {
            isAdmin: this.isAdmin,
            isSuperAdmin: this.isSuperAdmin
        });
    }
    
   
    
    createPanel() {
        console.log('🛠️ Creating admin panel HTML...');
        
        // Проверяем, не создана ли уже панель
        if (document.getElementById('adminPanel')) {
            console.log('⚠️ Admin panel already exists');
            return;
        }
        
        const panelHTML = `
            <div id="adminPanel" class="admin-panel hidden">
                <!-- Кнопка для открытия/закрытия (маленькая, в углу) -->
                <div class="admin-toggle-btn" id="adminToggleBtn">
                    <i class="fas fa-crown"></i>
                </div>
                
                <!-- Основное содержимое панели -->
                <div class="admin-content">
                    <div class="admin-header">
                        <h3><i class="fas fa-crown"></i> Панель администратора</h3>
                        <div class="admin-controls">
                            <button id="adminCloseBtn" class="admin-close-btn">
                                <i class="fas fa-times"></i>
                            </button>
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
                            <i class="fas fa-plus"></i> Добавить товар
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
                                        <tr><td colspan="5">Загрузка...</td></tr>
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
                                            <th>Дата регистрации</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody">
                                        <tr><td colspan="4">Загрузка...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div id="addTab" class="tab-pane">
                            <div class="admin-form">
                                <h4>Добавить новый товар</h4>
                                <div class="form-group">
                                    <input type="text" id="newProductName" placeholder="Название товара" class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="number" id="newProductPrice" placeholder="Цена" class="form-control" step="0.01">
                                </div>
                                <div class="form-group">
                                    <select id="newProductCategory" class="form-control">
                                        <option value="hair">Волосы</option>
                                        <option value="body">Тело</option>
                                        <option value="face">Лицо</option>
                                        <option value="kit">Наборы</option>
                                    </select>
                                </div>
                                <button id="addProductBtn" class="btn-add">Добавить товар</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-footer">
                        <button id="adminLogoutBtn" class="btn-logout">
                            <i class="fas fa-sign-out-alt"></i> Выйти из админ-панели
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем панель в body
        const panelDiv = document.createElement('div');
        panelDiv.innerHTML = panelHTML;
        document.body.appendChild(panelDiv.firstElementChild);
        
        // Добавляем стили
        this.addStyles();
        
        console.log('✅ Admin panel created');
    }
    
    addStyles() {
        const styles = `
            /* Основные стили админ-панели */
            .admin-panel {
                position: fixed;
                top: 0;
                right: 0;
                z-index: 10000;
                font-family: Arial, sans-serif;
            }
            
            /* Кнопка переключения */
            .admin-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10001;
                transition: all 0.3s ease;
            }
            
            .admin-toggle-btn:hover {
                transform: scale(1.1);
            }
            
            /* Основное содержимое */
            .admin-content {
                position: fixed;
                top: 0;
                right: 0;
                width: 450px;
                height: 100vh;
                background: white;
                box-shadow: -2px 0 20px rgba(0,0,0,0.2);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
                z-index: 10000;
            }
            
            .admin-panel:not(.hidden) .admin-content {
                transform: translateX(0);
            }
            
            /* Заголовок */
            .admin-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .admin-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .admin-close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Вкладки */
            .admin-tabs {
                display: flex;
                background: #f8f9fa;
                border-bottom: 1px solid #ddd;
            }
            
            .admin-tab {
                flex: 1;
                padding: 12px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                border-bottom: 3px solid transparent;
            }
            
            .admin-tab.active {
                color: #667eea;
                border-bottom-color: #667eea;
                background: white;
            }
            
            .admin-tab i {
                margin-right: 5px;
            }
            
            /* Контент вкладок */
            .admin-tab-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .tab-pane {
                display: none;
                height: 100%;
            }
            
            .tab-pane.active {
                display: block;
            }
            
            /* Таблицы */
            .table-container {
                overflow-x: auto;
                max-height: 400px;
            }
            
            .admin-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            
            .admin-table th {
                background: #f8f9fa;
                padding: 10px;
                text-align: left;
                border-bottom: 2px solid #ddd;
            }
            
            .admin-table td {
                padding: 8px 10px;
                border-bottom: 1px solid #eee;
            }
            
            .admin-table tr:hover {
                background: #f9f9f9;
            }
            
            /* Кнопки действий */
            .btn-action {
                padding: 4px 8px;
                margin: 0 2px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-edit {
                background: #ffc107;
                color: #000;
            }
            
            .btn-delete {
                background: #dc3545;
                color: white;
            }
            
            /* Форма добавления */
            .admin-form {
                padding: 20px;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-control {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .btn-add {
                width: 100%;
                padding: 10px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            /* Подвал */
            .admin-footer {
                padding: 15px;
                border-top: 1px solid #ddd;
                background: #f8f9fa;
            }
            
            .btn-logout {
                width: 100%;
                padding: 10px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .btn-refresh {
                padding: 8px 15px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 10px;
            }
            
            .admin-search {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            /* Уведомление об админе */
            .admin-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10002;
                animation: slideInRight 0.3s ease;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
    }
    
    setupEventListeners() {
        // Кнопка открытия/закрытия панели
        document.getElementById('adminToggleBtn')?.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // Кнопка закрытия панели
        document.getElementById('adminCloseBtn')?.addEventListener('click', () => {
            this.hidePanel();
        });
        
        // Переключение вкладок
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Выход из админ-панели
        document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
            this.logoutAdmin();
        });
        
        // Обновление списка товаров
        document.getElementById('refreshProducts')?.addEventListener('click', () => {
            this.loadProducts();
        });
        
        // Добавление товара
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.addProduct();
        });
        
        // Поиск товаров
        document.getElementById('productSearch')?.addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });
        
        // Загружаем данные при открытии панели
        document.getElementById('adminToggleBtn')?.addEventListener('click', () => {
            if (this.isPanelVisible) {
                this.loadProducts();
                this.loadUsers();
            }
        });
        
        console.log('✅ Admin panel event listeners setup');
    }
    
    togglePanel() {
        const panel = document.getElementById('adminPanel');
        this.isPanelVisible = !this.isPanelVisible;
        
        if (this.isPanelVisible) {
            panel.classList.remove('hidden');
            // Показываем уведомление
            this.showAdminNotification();
        } else {
            panel.classList.add('hidden');
        }
    }
    
    hidePanel() {
        const panel = document.getElementById('adminPanel');
        panel.classList.add('hidden');
        this.isPanelVisible = false;
    }
    
    showAdminNotification() {
        // Удаляем старое уведомление если есть
        const oldNotice = document.querySelector('.admin-notification');
        if (oldNotice) oldNotice.remove();
        
        // Создаем новое уведомление
        const notice = document.createElement('div');
        notice.className = 'admin-notification';
        notice.innerHTML = '<i class="fas fa-crown"></i> Вы вошли как администратор';
        
        document.body.appendChild(notice);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notice.parentNode) {
                notice.remove();
            }
        }, 5000);
    }
    
    switchTab(tabName) {
        // Обновляем активные вкладки
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.admin-tab[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Обновляем активные панели
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
        
        // Загружаем данные для активной вкладки
        if (tabName === 'products') {
            this.loadProducts();
        } else if (tabName === 'users') {
            this.loadUsers();
        }
    }
    
    logoutAdmin() {
        // Удаляем флаги администратора
        localStorage.removeItem('admin_session');
        localStorage.removeItem('is_admin');
        
        // Обновляем страницу
        alert('Вы вышли из админ-панели. Страница будет перезагружена.');
        window.location.reload();
    }
    
    async loadProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            const products = await response.json();
            
            const tbody = document.getElementById('productsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td><strong>${product.name}</strong></td>
                    <td>$${product.price.toFixed(2)}${product.oldPrice ? `<br><small><s>$${product.oldPrice.toFixed(2)}</s></small>` : ''}</td>
                    <td>${product.category}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="window.adminPanelInstance.editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="window.adminPanelInstance.deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
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
                tbody.innerHTML = '<tr><td colspan="5" style="color: red;">Ошибка загрузки товаров</td></tr>';
            }
        }
    }
    
    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/users');
            const users = await response.json();
            
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const row = document.createElement('tr');
                const isAdmin = user.email === 'admin@admin.com' || user.isAdmin;
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>
                        <strong>${user.name}</strong>
                        ${isAdmin ? '<br><span style="color: #667eea; font-size: 12px;">👑 Администратор</span>' : ''}
                    </td>
                    <td>${user.email}</td>
                    <td>${user.registrationDate}</td>
                `;
                tbody.appendChild(row);
            });
            
            console.log(`✅ Loaded ${users.length} users`);
        } catch (error) {
            console.error('❌ Error loading users:', error);
        }
    }
    
    async addProduct() {
        const name = document.getElementById('newProductName').value;
        const price = document.getElementById('newProductPrice').value;
        const category = document.getElementById('newProductCategory').value;
        
        if (!name || !price) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        try {
            // Получаем текущие товары для определения ID
            const response = await fetch('http://localhost:3000/products');
            const products = await response.json();
            const maxId = Math.max(...products.map(p => parseInt(p.id) || 0));
            const newId = maxId + 1;
            
            const newProduct = {
                id: newId.toString(),
                name: name,
                price: parseFloat(price),
                category: category,
                image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?w=400",
                reviews: 0,
                description: "Новый товар",
                volume: "100ml",
                ingredients: ["Natural Ingredients"],
                features: ["Эко-продукт"]
            };
            
            const addResponse = await fetch('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });
            
            if (addResponse.ok) {
                alert('Товар успешно добавлен!');
                document.getElementById('newProductName').value = '';
                document.getElementById('newProductPrice').value = '';
                this.loadProducts();
            }
        } catch (error) {
            console.error('❌ Error adding product:', error);
            alert('Ошибка при добавлении товара');
        }
    }
    
    async editProduct(productId) {
        const newName = prompt('Введите новое название товара:');
        if (!newName) return;
        
        const newPrice = prompt('Введите новую цену товара:');
        if (!newPrice) return;
        
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
                alert('Товар обновлен!');
                this.loadProducts();
            }
        } catch (error) {
            console.error('❌ Error editing product:', error);
            alert('Ошибка при обновлении товара');
        }
    }
    
    async deleteProduct(productId) {
        if (!confirm(`Вы уверены, что хотите удалить товар #${productId}?`)) return;
        
        try {
            const response = await fetch(`http://localhost:3000/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Товар удален!');
                this.loadProducts();
            }
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            alert('Ошибка при удалении товара');
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
    console.log('🚀 Initializing Admin Panel...');
    window.adminPanelInstance = new AdminPanel();
});