// edit-profile.js - Полная реализация редактирования профиля с валидацией

class EditProfileManager {
    constructor() {
        this.currentUser = null;
        this.top100Passwords = this.getTop100Passwords();
        this.init();
    }
    
    async init() {
        console.log('📝 Инициализация редактирования профиля...');
        
        try {
            // Проверяем авторизацию
            await this.checkAuthentication();
            
            // Загружаем данные пользователя
            await this.loadUserData();
            
            // Настраиваем форму
            this.setupForm();
            this.setupEventListeners();
            this.setupDatePicker();
            this.setupPhoneMask();
            
            console.log('✅ Редактирование профиля инициализировано');
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки данных. Пожалуйста, войдите снова.');
            setTimeout(() => window.location.href = 'login.html', 3000);
        }finally {
            // Гарантируем скрытие прелоадера
            this.hidePreloader();
        }
    }
     hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }
    showPreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'flex';
            preloader.style.opacity = '1';
            preloader.style.visibility = 'visible';
        }
    }
    async checkAuthentication() {
        const savedUser = localStorage.getItem('everist_currentUser');
        if (!savedUser) {
            throw new Error('Пользователь не авторизован');
        }
        
        this.currentUser = JSON.parse(savedUser);
        console.log('✅ Пользователь авторизован:', this.currentUser.email);
    }
    
    async loadUserData() {
        try {
            // Пробуем загрузить свежие данные с сервера
            const response = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
            if (response.ok) {
                const freshUser = await response.json();
                this.currentUser = freshUser;
                localStorage.setItem('everist_currentUser', JSON.stringify(freshUser));
                console.log('✅ Данные пользователя загружены с сервера');
            }
        } catch (error) {
            console.log('⚠️ Не удалось загрузить с сервера, используем локальные данные');
        }
        
        this.populateForm();
    }
    
    populateForm() {
        // Разбиваем полное имя на части
        this.parseFullName();
        
        // Заполняем форму
        document.getElementById('firstName').value = this.currentUser.firstName || '';
        document.getElementById('lastName').value = this.currentUser.lastName || '';
        document.getElementById('middleName').value = this.currentUser.middleName || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('username').value = this.currentUser.username || '';
        document.getElementById('address').value = this.currentUser.address || '';
        
        // Преобразуем телефон из формата +375 XX XXX XX XX в XX-XXX-XX-XX
        if (this.currentUser.phone) {
            const phoneDigits = this.currentUser.phone.replace(/\D/g, '').slice(-9);
            if (phoneDigits.length === 9) {
                const formatted = `${phoneDigits.substring(0, 2)}-${phoneDigits.substring(2, 5)}-${phoneDigits.substring(5, 7)}-${phoneDigits.substring(7, 9)}`;
                document.getElementById('phone').value = formatted;
            }
        }
        
        // Преобразуем дату рождения из dd.mm.yyyy в формат для flatpickr
        if (this.currentUser.birthDate) {
            const parts = this.currentUser.birthDate.split('.');
            if (parts.length === 3) {
                const date = new Date(parts[2], parts[1] - 1, parts[0]);
                document.getElementById('birthDate').value = this.currentUser.birthDate;
            }
        }
    }
    
    parseFullName() {
        if (!this.currentUser.name) return;
        
        const nameParts = this.currentUser.name.split(' ');
        if (nameParts.length >= 3) {
            this.currentUser.lastName = nameParts[0] || '';
            this.currentUser.firstName = nameParts[1] || '';
            this.currentUser.middleName = nameParts[2] || '';
        } else if (nameParts.length === 2) {
            this.currentUser.lastName = nameParts[0] || '';
            this.currentUser.firstName = nameParts[1] || '';
            this.currentUser.middleName = '';
        } else if (nameParts.length === 1) {
            this.currentUser.firstName = nameParts[0] || '';
            this.currentUser.lastName = '';
            this.currentUser.middleName = '';
        }
    }
    
    setupForm() {
        const form = document.getElementById('editProfileForm');
        if (form) {
            form.onsubmit = (e) => this.submitForm(e);
        }
    }
    
    setupEventListeners() {
        // Валидация в реальном времени
        this.setupRealTimeValidation();
        
        // Показать/скрыть пароль
        document.getElementById('togglePassword')?.addEventListener('click', () => 
            this.togglePasswordVisibility('password'));
        document.getElementById('toggleConfirmPassword')?.addEventListener('click', () => 
            this.togglePasswordVisibility('confirmPassword'));
        
        // Проверка уникальности email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value.trim();
                if (email && email !== this.currentUser.email) {
                    this.checkEmailExists(email);
                }
            });
        }
        
        // Проверка уникальности username
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', () => {
                const username = usernameInput.value.trim();
                if (username && username !== this.currentUser.username) {
                    this.checkUsernameExists(username);
                }
            });
        }
    }
    
    setupRealTimeValidation() {
        // ФИО
        ['firstName', 'lastName', 'middleName'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.validateName(input));
                input.addEventListener('blur', () => this.validateName(input));
            }
        });
        
        // Email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateEmail(emailInput.value));
        }
        
        // Телефон
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.validatePhone(phoneInput.value));
        }
        
        // Имя пользователя
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('input', () => this.validateUsername(usernameInput.value));
        }
        
        // Пароль
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
                this.validateConfirmPassword();
            });
        }
        
        // Подтверждение пароля
        const confirmInput = document.getElementById('confirmPassword');
        if (confirmInput) {
            confirmInput.addEventListener('input', () => this.validateConfirmPassword());
        }
    }
    
    setupDatePicker() {
        const birthDateInput = document.getElementById('birthDate');
        if (!birthDateInput) return;
        
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 16);
        
        flatpickr('#birthDate', {
            dateFormat: 'd.m.Y',
            locale: 'ru',
            maxDate: maxDate,
            defaultDate: birthDateInput.value || maxDate,
            onChange: (selectedDates) => {
                if (selectedDates[0]) {
                    this.validateBirthDate(selectedDates[0]);
                }
            }
        });
    }
    
    setupPhoneMask() {
        const phoneInput = document.getElementById('phone');
        if (!phoneInput) return;
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 9) {
                value = value.substring(0, 9);
            }
            
            let formatted = '';
            if (value.length > 0) {
                formatted = value.substring(0, 2);
                if (value.length > 2) {
                    formatted += '-' + value.substring(2, 5);
                }
                if (value.length > 5) {
                    formatted += '-' + value.substring(5, 7);
                }
                if (value.length > 7) {
                    formatted += '-' + value.substring(7, 9);
                }
            }
            
            e.target.value = formatted;
            this.validatePhone(formatted);
        });
    }
    
    async submitForm(e) {
        e.preventDefault();
        
        if (!this.validateAll()) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        submitBtn.disabled = true;
        
        try {
            // Подготавливаем данные для отправки
            const updates = this.prepareUpdateData();
            
            // Отправляем PATCH запрос на сервер
            const response = await fetch(`http://localhost:3000/users/${this.currentUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const updatedUser = await response.json();
            
            // Обновляем локальные данные
            this.currentUser = { ...this.currentUser, ...updates };
            localStorage.setItem('everist_currentUser', JSON.stringify(this.currentUser));
            
            this.showSuccess('Данные успешно сохранены! Перенаправление в профиль...');
            
            // Перенаправляем через 2 секунды
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            this.showError('Ошибка при сохранении данных. Попробуйте еще раз.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    prepareUpdateData() {
        const updates = {};
        
        // Собираем полное имя
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        
        let fullName = lastName;
        if (firstName) fullName += ' ' + firstName;
        if (middleName) fullName += ' ' + middleName;
        
        if (fullName !== this.currentUser.name) {
            updates.name = fullName.trim();
        }
        
        // Email
        const email = document.getElementById('email').value.trim();
        if (email !== this.currentUser.email) {
            updates.email = email;
        }
        
        // Телефон (преобразуем в формат +375 XX XXX XX XX)
        const phone = document.getElementById('phone').value.replace(/-/g, '');
        if (phone && phone !== this.currentUser.phone?.replace(/\D/g, '').slice(-9)) {
            const formattedPhone = `+375 ${phone.substring(0, 2)} ${phone.substring(2, 5)} ${phone.substring(5, 7)} ${phone.substring(7, 9)}`;
            updates.phone = formattedPhone.trim();
        }
        
        // Адрес
        const address = document.getElementById('address').value.trim();
        if (address !== this.currentUser.address) {
            updates.address = address;
        }
        
        // Имя пользователя
        const username = document.getElementById('username').value.trim();
        if (username !== this.currentUser.username) {
            updates.username = username;
        }
        
        // Дата рождения
        const birthDate = document.getElementById('birthDate').value;
        if (birthDate !== this.currentUser.birthDate) {
            updates.birthDate = birthDate;
        }
        
        // Пароль (только если введен новый)
        const password = document.getElementById('password').value;
        if (password) {
            updates.password = password;
        }
        
        return updates;
    }
    
    validateAll() {
        const errors = [];
        
        // Проверка имени
        if (!this.validateName(document.getElementById('firstName'))) {
            errors.push('Проверьте поле "Имя"');
        }
        
        if (!this.validateName(document.getElementById('lastName'))) {
            errors.push('Проверьте поле "Фамилия"');
        }
        
        // Проверка email
        const email = document.getElementById('email').value.trim();
        if (!this.isValidEmail(email)) {
            errors.push('Введите корректный email');
        }
        
        // Проверка телефона
        const phone = document.getElementById('phone').value;
        if (!this.isValidPhone(phone)) {
            errors.push('Введите корректный номер телефона (формат: XX-XXX-XX-XX)');
        }
        
        // Проверка имени пользователя
        const username = document.getElementById('username').value.trim();
        if (!this.validateUsername(username)) {
            errors.push('Имя пользователя должно содержать только буквы, цифры и _ (минимум 3 символа)');
        }
        
        // Проверка даты рождения
        const birthDate = document.getElementById('birthDate').value;
        if (!this.isValidBirthDate(birthDate)) {
            errors.push('Вам должно быть не менее 16 лет');
        }
        
        // Проверка пароля (если введен)
        const password = document.getElementById('password').value;
        if (password) {
            if (!this.isValidPassword(password)) {
                errors.push('Пароль не соответствует требованиям');
            }
            
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                errors.push('Пароли не совпадают');
            }
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    // Валидационные методы (аналогичные registr.js)
    validateName(input) {
        if (!input) return false;
        
        const value = input.value.trim();
        const isValid = !value || this.isValidName(value);
        
        this.toggleFieldValidation(input, isValid, 
            isValid ? 'Имя корректно' : 'Имя содержит недопустимые символы');
        return isValid;
    }
    
    validateEmail(email) {
        const isValid = this.isValidEmail(email);
        const input = document.getElementById('email');
        
        if (input) {
            this.toggleFieldValidation(input, isValid, 
                isValid ? 'Email корректный' : 'Введите корректный email');
        }
        return isValid;
    }
    
    async checkEmailExists(email) {
        try {
            const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
            if (!response.ok) return false;
            
            const users = await response.json();
            const exists = users.length > 0 && users[0].id !== this.currentUser.id;
            
            const statusElement = document.getElementById('emailStatus');
            if (statusElement) {
                if (exists) {
                    statusElement.textContent = 'Этот email уже занят';
                    statusElement.style.color = '#e74c3c';
                } else {
                    statusElement.textContent = 'Email доступен';
                    statusElement.style.color = '#27ae60';
                }
            }
            
            return exists;
        } catch (error) {
            console.error('Ошибка проверки email:', error);
            return false;
        }
    }
    
    async checkUsernameExists(username) {
        try {
            const response = await fetch(`http://localhost:3000/users?username=${username}`);
            if (!response.ok) return false;
            
            const users = await response.json();
            const exists = users.length > 0 && users[0].id !== this.currentUser.id;
            
            const statusElement = document.getElementById('usernameStatus');
            if (statusElement) {
                if (exists) {
                    statusElement.textContent = 'Этот никнейм уже занят';
                    statusElement.style.color = '#e74c3c';
                } else {
                    statusElement.textContent = 'Никнейм доступен';
                    statusElement.style.color = '#27ae60';
                }
            }
            
            return exists;
        } catch (error) {
            console.error('Ошибка проверки никнейма:', error);
            return false;
        }
    }
    
    validatePhone(phone) {
        const value = phone.replace(/-/g, '');
        const isValid = value.length === 9 && /^[0-9]{9}$/.test(value);
        
        const input = document.getElementById('phone');
        if (input) {
            this.toggleFieldValidation(input, isValid, 
                isValid ? 'Номер корректный' : 'Введите 9 цифр номера');
        }
        return isValid;
    }
    
    validateUsername(username) {
        const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
        const input = document.getElementById('username');
        
        if (input) {
            this.toggleFieldValidation(input, isValid, 
                isValid ? 'Никнейм корректный' : 'Только буквы, цифры и _ (мин. 3 символа)');
        }
        return isValid;
    }
    
    validateBirthDate(dateString) {
        const isValid = this.isValidBirthDate(dateString);
        const input = document.getElementById('birthDate');
        
        if (input) {
            this.toggleFieldValidation(input, isValid, 
                isValid ? 'Дата корректна' : 'Вам должно быть не менее 16 лет');
        }
        return isValid;
    }
    
    validatePassword(password) {
        const isValid = this.isValidPassword(password);
        this.updatePasswordStrength(password);
        this.updatePasswordRequirements(password);
        
        const input = document.getElementById('password');
        if (input) {
            this.toggleFieldValidation(input, isValid, 
                isValid ? 'Пароль соответствует требованиям' : 'Пароль не соответствует требованиям');
        }
        return isValid;
    }
    
    validateConfirmPassword() {
        const password = document.getElementById('password')?.value || '';
        const confirm = document.getElementById('confirmPassword')?.value || '';
        const isValid = !password || password === confirm;
        
        const input = document.getElementById('confirmPassword');
        const hint = document.getElementById('confirmHint');
        
        if (input && hint) {
            if (!password) {
                hint.textContent = 'Оставьте пустым, если не меняете пароль';
                hint.style.color = '#666';
            } else if (isValid) {
                hint.textContent = 'Пароли совпадают';
                hint.style.color = '#27ae60';
            } else {
                hint.textContent = 'Пароли не совпадают';
                hint.style.color = '#e74c3c';
            }
        }
        
        return isValid;
    }
    
    // Проверки
    isValidName(name) {
        return /^[A-Za-zА-Яа-яЁё\s\-]+$/.test(name) && name.length >= 2;
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPhone(phone) {
        const value = phone.replace(/-/g, '');
        return /^[0-9]{9}$/.test(value);
    }
    
    isValidBirthDate(dateString) {
        const parts = dateString.split('.');
        if (parts.length !== 3) return false;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return false;
        
        const now = new Date();
        const age = now.getFullYear() - year;
        
        if (age < 16) return false;
        if (age === 16) {
            const monthDiff = now.getMonth() - month;
            if (monthDiff < 0) return false;
            if (monthDiff === 0 && now.getDate() < day) return false;
        }
        
        return true;
    }
    
    isValidPassword(password) {
        return password.length >= 8 &&
               password.length <= 20 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[0-9]/.test(password) &&
               /[^A-Za-z0-9]/.test(password) &&
               !this.isCommonPassword(password);
    }
    
    isCommonPassword(password) {
        return this.top100Passwords.includes(password.toLowerCase());
    }
    
    updatePasswordStrength(password) {
        const meter = document.getElementById('passwordStrength');
        const label = document.getElementById('strengthLabel');
        
        if (!meter || !label) return;
        
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        meter.className = 'strength-meter';
        
        if (password.length === 0) {
            label.textContent = 'Введите пароль';
        } else if (strength <= 2) {
            meter.classList.add('weak');
            label.textContent = 'Слабый пароль';
        } else if (strength <= 4) {
            meter.classList.add('medium');
            label.textContent = 'Средний пароль';
        } else {
            meter.classList.add('strong');
            label.textContent = 'Сильный пароль';
        }
    }
    
    updatePasswordRequirements(password) {
        const requirements = {
            'length': password.length >= 8 && password.length <= 20,
            'uppercase': /[A-Z]/.test(password),
            'lowercase': /[a-z]/.test(password),
            'digit': /[0-9]/.test(password),
            'special': /[^A-Za-z0-9]/.test(password),
            'common': !this.isCommonPassword(password)
        };
        
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                const icon = element.querySelector('i');
                if (requirements[req]) {
                    element.classList.add('valid');
                    element.classList.remove('invalid');
                    if (icon) icon.style.color = '#27ae60';
                } else {
                    element.classList.add('invalid');
                    element.classList.remove('valid');
                    if (icon) icon.style.color = '#e74c3c';
                }
            }
        });
    }
    
    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const toggleBtn = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
        
        if (!field || !toggleBtn) return;
        
        if (field.type === 'password') {
            field.type = 'text';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            field.type = 'password';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
    
    toggleFieldValidation(input, isValid, message) {
        if (!input) return;
        
        input.classList.remove('error', 'success');
        
        if (input.value.trim() === '') {
            return;
        }
        
        if (isValid) {
            input.classList.add('success');
        } else {
            input.classList.add('error');
        }
        
        const parent = input.parentElement;
        if (parent) {
            const hint = parent.querySelector('.field-hint');
            if (hint) {
                hint.textContent = message;
                hint.style.color = isValid ? '#27ae60' : '#e74c3c';
            }
        }
    }
    
    getTop100Passwords() {
        return [
            'password', '123456', '12345678', '123456789', '12345',
            'qwerty', 'abc123', 'password1', '1234567', '1234567890',
            'admin', 'welcome', 'monkey', 'letmein', 'dragon',
            'football', 'baseball', '123123', 'superman', '1qaz2wsx',
            'qazwsx', '123qwe', 'qwertyuiop', 'qwerty123', 'hello',
            'password123', '1234', '123456a', 'sunshine', 'princess',
            'admin123', 'passw0rd', 'master', 'login', 'trustno1',
            'qwerty1', 'welcome1', 'solo', 'zaq1zaq1', 'ashley',
            'mustang', 'michael', 'bailey', 'shadow', 'jesus',
            'ninja', 'access', 'loveme', 'whatever', 'donald',
            'hockey', '1q2w3e4r', 'freedom', 'charlie', 'aa123456',
            'qwer1234', 'hello123', 'secret', 'qazwsxedc', 'asdfgh',
            'zxcvbn', 'asdfghjkl', 'starwars', 'photoshop', '1q2w3e',
            '123qweasd', 'adminadmin', 'pass', 'qweqwe', 'qweasdzxc',
            '1q2w3e4r5t', '123abc', 'batman', 'super123', 'iloveyou',
            'flower', 'password!', '123456789a', '123!@#qwe', '123321',
            '123456q', '123456qwerty', '654321', 'q1w2e3r4', 'computer',
            'test123', 'test', '1234qwer', '1qazxsw2', '555555',
            'qwerty123456', '12345678a', 'pokemon', 'admin1', '123abc!@#'
        ];
    }
    
    showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            successMessage.classList.add('show');
            
            setTimeout(() => {
                successMessage.classList.remove('show');
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 300);
            }, 3000);
        }
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.innerHTML = message;
            errorMessage.style.display = 'block';
            errorMessage.classList.add('show');
            
            // Прокручиваем к ошибке
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                errorMessage.classList.remove('show');
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 300);
            }, 5000);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.editProfileManager = new EditProfileManager();
});