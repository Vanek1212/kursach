// registr.js - Исправленная версия с числовым ID

class RegistrationManager {
    constructor() {
        this.currentStep = 1;
        this.usernameAttempts = 5;
        this.maxUsernameAttempts = 5;
        this.top100Passwords = this.getTop100Passwords();
        this.userData = {
            firstName: '',
            lastName: '',
            middleName: '',
            birthDate: '',
            phone: '',
            email: '',
            password: '',
            username: '',
            acceptedTerms: false
        };
        
        this.init();
    }
    
    init() {
        console.log('📝 Инициализация регистрации...');
        
        try {
            this.setupEventListeners();
            this.setupDatePicker();
            this.setupPhoneMask();
            this.generateInitialUsername();
            
            console.log('✅ Регистрация инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка инициализации формы');
        }
    }
    
    setupEventListeners() {
        // Навигация по шагам
        document.getElementById('nextStep1')?.addEventListener('click', () => this.goToStep(2));
        document.getElementById('nextStep2')?.addEventListener('click', () => this.validateEmailAndProceed());
        document.getElementById('backStep2')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('backStep3')?.addEventListener('click', () => this.goToStep(2));
        
        // Метод пароля
        document.querySelectorAll('input[name="passwordMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.togglePasswordMethod(e.target.value));
        });
        
        // Генерация пароля
        document.getElementById('regeneratePassword')?.addEventListener('click', () => this.generatePassword());
        document.getElementById('copyPassword')?.addEventListener('click', () => this.copyPassword());
        
        // Показать/скрыть пароль
        document.getElementById('togglePassword')?.addEventListener('click', () => this.togglePasswordVisibility('password'));
        document.getElementById('toggleConfirmPassword')?.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));
        
        // Никнейм
        document.getElementById('generateUsername')?.addEventListener('click', () => this.generateUsername());
        document.getElementById('editUsername')?.addEventListener('click', () => {
            const manualSection = document.getElementById('manualUsernameSection');
            if (manualSection.style.display === 'none') {
                this.enableManualUsername();
            } else {
                this.enableAutoUsername();
            }
        });
        
        // Валидация в реальном времени
        this.setupRealTimeValidation();
        
        // Пользовательское соглашение
        document.getElementById('showTermsModal')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTermsModal();
        });
        
        document.getElementById('closeTermsModal')?.addEventListener('click', () => this.hideTermsModal());
        document.getElementById('declineTerms')?.addEventListener('click', () => this.hideTermsModal());
        document.getElementById('acceptTerms')?.addEventListener('click', () => this.acceptTerms());
        
        // Отправка формы
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.submitForm(e));
        }
        
        // Запрет на вставку в подтверждение пароля
        document.getElementById('confirmPassword')?.addEventListener('paste', (e) => e.preventDefault());
    }
    
    setupDatePicker() {
        const birthDateInput = document.getElementById('birthDate');
        if (!birthDateInput) return;
        
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 100);
        
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 16);
        
        flatpickr('#birthDate', {
            dateFormat: 'd.m.Y',
            locale: 'ru',
            maxDate: maxDate,
            minDate: minDate,
            defaultDate: maxDate,
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
        
        // Устанавливаем маску ввода XX-XXX-XX-XX
        phoneInput.placeholder = '29-123-45-67';
        phoneInput.maxLength = 12; // 11 цифр + 3 дефиса = 12 символов
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Удаляем все нецифры
            
            // Ограничиваем до 9 цифр (формат Беларуси без кода страны)
            if (value.length > 9) {
                value = value.substring(0, 9);
            }
            
            // Форматируем как XX-XXX-XX-XX
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
        
        // Валидация при потере фокуса
        phoneInput.addEventListener('blur', () => {
            this.validatePhone(phoneInput.value);
        });
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
        
        // Email - добавлена проверка на сервере при blur
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value.trim();
                if (email && this.isValidEmail(email)) {
                    this.checkEmailExists(email);
                }
            });
            emailInput.addEventListener('input', () => this.validateEmail(emailInput.value));
            emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value));
        }
        
        // Пароль
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword(passwordInput.value));
            passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput.value));
        }
        
        // Подтверждение пароля
        const confirmInput = document.getElementById('confirmPassword');
        if (confirmInput) {
            confirmInput.addEventListener('input', () => this.validateConfirmPassword());
            confirmInput.addEventListener('blur', () => this.validateConfirmPassword());
        }
        
        // Ручной никнейм
        const manualUsernameInput = document.getElementById('manualUsername');
        if (manualUsernameInput) {
            manualUsernameInput.addEventListener('input', () => this.validateUsername(manualUsernameInput.value));
        }
    }
    
    // Новая функция для проверки email и перехода
    async validateEmailAndProceed() {
        const email = document.getElementById('email')?.value.trim() || '';
        
        if (!email) {
            this.showError('Введите email');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Введите корректный email');
            return;
        }
        
        // Проверяем остальные поля шага 2
        if (!this.validateStep2WithoutEmail()) {
            return;
        }
        
        // Показываем загрузку
        const nextBtn = document.getElementById('nextStep2');
        if (nextBtn) {
            const originalText = nextBtn.innerHTML;
            nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка email...';
            nextBtn.disabled = true;
        }
        
        try {
            // Проверяем существует ли email на сервере
            const emailExists = await this.checkEmailExists(email, true);
            
            if (emailExists) {
                this.showError('Этот email уже зарегистрирован. Используйте другой email или восстановите пароль.');
                return;
            }
            
            // Если email уникален, переходим к шагу 3
            this.goToStep(3);
        } finally {
            // Восстанавливаем кнопку
            const nextBtn = document.getElementById('nextStep2');
            if (nextBtn) {
                nextBtn.innerHTML = 'Далее';
                nextBtn.disabled = false;
            }
        }
    }
    
    // Валидация шага 2 без проверки email (для проверки уникальности отдельно)
    validateStep2WithoutEmail() {
        const phone = document.getElementById('phone')?.value.trim() || '';
        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        
        const errors = [];
        
        if (!phone) {
            errors.push('Введите номер телефона');
        } else if (!this.isValidPhone(phone)) {
            errors.push('Введите корректный номер телефона (формат: XX-XXX-XX-XX)');
        }
        
        if (passwordMethod === 'manual') {
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirmPassword')?.value || '';
            
            if (!password) {
                errors.push('Введите пароль');
            } else if (!this.isValidPassword(password)) {
                errors.push('Пароль не соответствует требованиям');
            }
            
            if (!confirmPassword) {
                errors.push('Подтвердите пароль');
            } else if (password !== confirmPassword) {
                errors.push('Пароли не совпадают');
            }
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    // Проверка email на сервере
    async checkEmailExists(email, showError = false) {
        try {
            const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
            if (!response.ok) {
                throw new Error('Ошибка при проверке email');
            }
            
            const users = await response.json();
            const exists = users.length > 0;
            
            if (exists && showError) {
                return true;
            }
            
            // Обновляем поле с информацией о доступности
            const emailInput = document.getElementById('email');
            if (emailInput && emailInput.value.trim() === email) {
                const parent = emailInput.parentElement;
                if (parent) {
                    const hint = parent.querySelector('.field-hint');
                    if (hint) {
                        const icon = hint.querySelector('i');
                        if (exists) {
                            hint.textContent = 'Этот email уже зарегистрирован';
                            hint.style.color = '#e74c3c';
                            if (icon) {
                                icon.className = 'fas fa-exclamation-circle';
                                icon.style.color = '#e74c3c';
                            }
                        } else {
                            hint.textContent = 'Email доступен для регистрации';
                            hint.style.color = '#27ae60';
                            if (icon) {
                                icon.className = 'fas fa-check-circle';
                                icon.style.color = '#27ae60';
                            }
                        }
                    }
                }
            }
            
            return exists;
        } catch (error) {
            console.error('Ошибка при проверке email:', error);
            if (showError) {
                this.showError('Не удалось проверить email. Попробуйте позже.');
            }
            return false;
        }
    }
    
    goToStep(step) {
        // Валидация перед переходом
        if (!this.validateStep(this.currentStep)) {
            return;
        }
        
        // Сохраняем данные текущего шага
        this.saveStepData(this.currentStep);
        
        // Переход к следующему шагу
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active'));
        
        const stepElement = document.getElementById(`step${step}`);
        const progressElement = document.querySelector(`.progress-step[data-step="${step}"]`);
        
        if (stepElement) stepElement.classList.add('active');
        if (progressElement) progressElement.classList.add('active');
        
        this.currentStep = step;
        
        // Если переходим на шаг 3, генерируем никнейм если нужно
        if (step === 3 && !this.userData.username) {
            this.generateInitialUsername();
        }
    }
    
    validateStep(step) {
        switch(step) {
            case 1:
                return this.validateStep1();
            case 2:
                // Для шага 2 используем новую логику с validateEmailAndProceed
                return true;
            case 3:
                return this.validateStep3();
            default:
                return false;
        }
    }
    
    validateStep1() {
        const firstName = document.getElementById('firstName')?.value.trim() || '';
        const lastName = document.getElementById('lastName')?.value.trim() || '';
        const birthDate = document.getElementById('birthDate')?.value || '';
        
        const errors = [];
        
        if (!firstName) {
            errors.push('Введите имя');
        } else if (!this.isValidName(firstName)) {
            errors.push('Имя содержит недопустимые символы');
        }
        
        if (!lastName) {
            errors.push('Введите фамилию');
        } else if (!this.isValidName(lastName)) {
            errors.push('Фамилия содержит недопустимые символы');
        }
        
        if (!birthDate) {
            errors.push('Выберите дату рождения');
        } else if (!this.isValidBirthDate(birthDate)) {
            errors.push('Вам должно быть не менее 16 лет');
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    validateStep2() {
        const phone = document.getElementById('phone')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        
        const errors = [];
        
        if (!phone) {
            errors.push('Введите номер телефона');
        } else if (!this.isValidPhone(phone)) {
            errors.push('Введите корректный номер телефона (формат: XX-XXX-XX-XX)');
        }
        
        if (!email) {
            errors.push('Введите email');
        } else if (!this.isValidEmail(email)) {
            errors.push('Введите корректный email');
        }
        
        if (passwordMethod === 'manual') {
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirmPassword')?.value || '';
            
            if (!password) {
                errors.push('Введите пароль');
            } else if (!this.isValidPassword(password)) {
                errors.push('Пароль не соответствует требованиям');
            }
            
            if (!confirmPassword) {
                errors.push('Подтвердите пароль');
            } else if (password !== confirmPassword) {
                errors.push('Пароли не совпадают');
            }
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    validateStep3() {
        const terms = document.getElementById('terms')?.checked || false;
        const usernameField = document.getElementById('username');
        const manualUsernameField = document.getElementById('manualUsername');
        const manualSection = document.getElementById('manualUsernameSection');
        
        let username = '';
        const errors = [];
        
        if (manualSection && manualSection.style.display !== 'none') {
            // Используем ручной ввод
            username = manualUsernameField?.value.trim() || '';
            if (!username) {
                errors.push('Введите никнейм вручную');
            } else if (!this.validateUsername(username)) {
                errors.push('Никнейм должен содержать только буквы, цифры и _ (минимум 3 символа)');
            }
        } else {
            // Используем сгенерированный никнейм
            username = usernameField?.value.trim() || '';
            if (!username) {
                errors.push('Сгенерируйте или введите никнейм вручную');
            }
        }
        
        if (!terms) {
            errors.push('Примите пользовательское соглашение');
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    saveStepData(step) {
        switch(step) {
            case 1:
                this.userData.firstName = document.getElementById('firstName')?.value.trim() || '';
                this.userData.lastName = document.getElementById('lastName')?.value.trim() || '';
                this.userData.middleName = document.getElementById('middleName')?.value.trim() || '';
                this.userData.birthDate = document.getElementById('birthDate')?.value || '';
                break;
            case 2:
                // Убираем дефисы из телефона перед сохранением
                this.userData.phone = document.getElementById('phone')?.value.replace(/-/g, '') || '';
                this.userData.email = document.getElementById('email')?.value.trim() || '';
                
                const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
                if (passwordMethod === 'manual') {
                    this.userData.password = document.getElementById('password')?.value || '';
                } else {
                    this.userData.password = document.getElementById('generatedPassword')?.value || '';
                }
                break;
            case 3:
                const manualUsername = document.getElementById('manualUsername');
                const manualSection = document.getElementById('manualUsernameSection');
                
                if (manualSection && manualSection.style.display !== 'none') {
                    this.userData.username = manualUsername?.value.trim() || '';
                } else {
                    this.userData.username = document.getElementById('username')?.value.trim() || '';
                }
                this.userData.acceptedTerms = document.getElementById('terms')?.checked || false;
                break;
        }
    }
    
    togglePasswordMethod(method) {
        const manualSection = document.getElementById('manualPasswordSection');
        const autoSection = document.getElementById('autoPasswordSection');
        
        if (method === 'manual') {
            if (manualSection) manualSection.style.display = 'block';
            if (autoSection) autoSection.style.display = 'none';
            
            // Делаем поля обязательными
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirmPassword');
            if (passwordInput) passwordInput.required = true;
            if (confirmInput) confirmInput.required = true;
        } else {
            if (manualSection) manualSection.style.display = 'none';
            if (autoSection) autoSection.style.display = 'block';
            
            // Генерируем пароль если еще не сгенерирован
            const generatedPassword = document.getElementById('generatedPassword');
            if (generatedPassword && !generatedPassword.value) {
                this.generatePassword();
            }
            
            // Убираем обязательность полей
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirmPassword');
            if (passwordInput) passwordInput.required = false;
            if (confirmInput) confirmInput.required = false;
        }
    }
    
    generatePassword() {
        const length = 12;
        const charset = {
            uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
            lowercase: 'abcdefghijkmnpqrstuvwxyz',
            digits: '23456789',
            special: '!@#$%^&*'
        };
        
        let password = '';
        
        // Гарантируем минимум по одному символу из каждой категории
        password += this.getRandomChar(charset.uppercase);
        password += this.getRandomChar(charset.lowercase);
        password += this.getRandomChar(charset.digits);
        password += this.getRandomChar(charset.special);
        
        // Заполняем оставшиеся символы
        const allChars = charset.uppercase + charset.lowercase + charset.digits + charset.special;
        for (let i = password.length; i < length; i++) {
            password += this.getRandomChar(allChars);
        }
        
        // Перемешиваем пароль
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        const generatedPasswordField = document.getElementById('generatedPassword');
        if (generatedPasswordField) {
            generatedPasswordField.value = password;
        }
        
        // Показываем сообщение
        this.showSuccess('Пароль сгенерирован');
    }
    
    getRandomChar(charset) {
        return charset[Math.floor(Math.random() * charset.length)];
    }
    
    copyPassword() {
        const passwordField = document.getElementById('generatedPassword');
        if (!passwordField) return;
        
        passwordField.select();
        passwordField.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(passwordField.value)
            .then(() => {
                const copyBtn = document.getElementById('copyPassword');
                if (copyBtn) {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.style.backgroundColor = '#27ae60';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.backgroundColor = '';
                    }, 2000);
                }
                
                this.showSuccess('Пароль скопирован в буфер обмена');
            })
            .catch(err => {
                console.error('Ошибка копирования:', err);
                this.showError('Не удалось скопировать пароль');
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
    
    generateInitialUsername() {
        if (this.userData.firstName && this.userData.lastName) {
            const baseUsername = `${this.userData.firstName.toLowerCase()}_${this.userData.lastName.toLowerCase()}`;
            const randomNum = Math.floor(Math.random() * 1000);
            const username = `${baseUsername}${randomNum}`;
            
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.value = username;
            }
            this.userData.username = username;
            this.updateAttemptsCount();
        }
    }
    
    generateUsername() {
        if (this.usernameAttempts <= 0) {
            this.showError('Лимит попыток генерации исчерпан. Введите никнейм вручную.');
            return;
        }
        
        const adjectives = ['cool', 'smart', 'happy', 'creative', 'brave', 'kind', 'wise', 'fast', 'bright', 'calm'];
        const nouns = ['tiger', 'eagle', 'wolf', 'phoenix', 'dragon', 'lion', 'fox', 'bear', 'hawk', 'panther'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 999);
        
        const username = `${adj}_${noun}${num}`;
        
        const manualSection = document.getElementById('manualUsernameSection');
        if (manualSection && manualSection.style.display !== 'none') {
            const manualUsernameField = document.getElementById('manualUsername');
            if (manualUsernameField) {
                manualUsernameField.value = username;
                this.validateUsername(username);
            }
        } else {
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.value = username;
            }
        }
        
        this.userData.username = username;
        
        this.usernameAttempts--;
        this.updateAttemptsCount();
        
        if (this.usernameAttempts === 0) {
            const generateBtn = document.getElementById('generateUsername');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-ban"></i> Лимит исчерпан';
                generateBtn.style.backgroundColor = '#e74c3c';
            }
            
            this.showError('Лимит попыток генерации исчерпан');
        }
    }
    
    enableManualUsername() {
        const usernameField = document.getElementById('username');
        const manualSection = document.getElementById('manualUsernameSection');
        const editBtn = document.getElementById('editUsername');
        
        if (usernameField) usernameField.readOnly = true;
        if (manualSection) manualSection.style.display = 'block';
        
        if (editBtn) {
            editBtn.disabled = true;
            editBtn.innerHTML = '<i class="fas fa-check"></i> Включен ручной ввод';
        }
        
        const hint = document.querySelector('.field-hint');
        if (hint) {
            hint.innerHTML = '<i class="fas fa-keyboard"></i> Режим ручного ввода. Кнопка генерации остается активной.';
            hint.style.color = '#3498db';
        }
        
        setTimeout(() => {
            const manualUsernameField = document.getElementById('manualUsername');
            if (manualUsernameField) {
                manualUsernameField.focus();
            }
        }, 100);
    }
    
    enableAutoUsername() {
        const manualSection = document.getElementById('manualUsernameSection');
        const editBtn = document.getElementById('editUsername');
        
        if (manualSection) manualSection.style.display = 'none';
        
        if (editBtn) {
            editBtn.disabled = false;
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Ввести вручную';
        }
        
        const hint = document.querySelector('.field-hint');
        if (hint) {
            hint.innerHTML = `<i class="fas fa-sync-alt"></i> Осталось попыток генерации: <span id="attemptsCount">${this.usernameAttempts}</span>`;
            hint.style.color = '#666';
        }
    }
    
    updateAttemptsCount() {
        const attemptsCount = document.getElementById('attemptsCount');
        if (attemptsCount) {
            attemptsCount.textContent = this.usernameAttempts;
            
            if (this.usernameAttempts <= 2) {
                attemptsCount.style.color = '#e74c3c';
                attemptsCount.style.fontWeight = 'bold';
            } else if (this.usernameAttempts <= 3) {
                attemptsCount.style.color = '#f39c12';
            } else {
                attemptsCount.style.color = '#27ae60';
            }
        }
        
        const generateBtn = document.getElementById('generateUsername');
        if (generateBtn) {
            if (this.usernameAttempts <= 0) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-ban"></i> Лимит исчерпан';
                generateBtn.style.backgroundColor = '#e74c3c';
            } else {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-dice"></i> Сгенерировать';
                generateBtn.style.backgroundColor = '#3498db';
            }
        }
    }
    
    validateName(input) {
        if (!input) return false;
        
        const value = input.value.trim();
        const isValid = !value || this.isValidName(value);
        
        this.toggleFieldValidation(input, isValid, isValid ? 'Имя корректно' : 'Имя содержит недопустимые символы');
        return isValid;
    }
    
    validateBirthDate(dateString) {
        const date = this.parseDate(dateString);
        const isValid = this.isValidBirthDate(dateString);
        
        const input = document.getElementById('birthDate');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Дата корректна' : 'Вам должно быть не менее 16 лет');
        }
        return isValid;
    }
    
    validatePhone(phone) {
        const value = phone.replace(/-/g, '');
        const isValid = value.length === 9 && /^[0-9]{9}$/.test(value);
        
        const input = document.getElementById('phone');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Номер корректный' : 'Введите 9 цифр номера (формат: XX-XXX-XX-XX)');
        }
        return isValid;
    }
    
    validateEmail(email) {
        const isValid = this.isValidEmail(email);
        
        const input = document.getElementById('email');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Email корректный' : 'Введите корректный email');
        }
        return isValid;
    }
    
    validatePassword(password) {
        const isValid = this.isValidPassword(password);
        this.updatePasswordStrength(password);
        this.updatePasswordRequirements(password);
        
        const input = document.getElementById('password');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Пароль соответствует требованиям' : 'Пароль не соответствует требованиям');
        }
        return isValid;
    }
    
    validateConfirmPassword() {
        const password = document.getElementById('password')?.value || '';
        const confirm = document.getElementById('confirmPassword')?.value || '';
        const isValid = password === confirm;
        
        const input = document.getElementById('confirmPassword');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Пароли совпадают' : 'Пароли не совпадают');
        }
        return isValid;
    }
    
    validateUsername(username) {
        const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
        
        const input = document.getElementById('manualUsername');
        if (input) {
            this.toggleFieldValidation(input, isValid, isValid ? 'Никнейм корректный' : 'Никнейм должен содержать только буквы, цифры и _');
        }
        return isValid;
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
    
    // Проверки
    isValidName(name) {
        return /^[A-Za-zА-Яа-яЁё\s\-]+$/.test(name) && name.length >= 2;
    }
    
    isValidBirthDate(dateString) {
        const date = this.parseDate(dateString);
        if (!date) return false;
        
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        
        if (age < 16) return false;
        if (age === 16) {
            const monthDiff = now.getMonth() - date.getMonth();
            if (monthDiff < 0) return false;
            if (monthDiff === 0 && now.getDate() < date.getDate()) return false;
        }
        
        return true;
    }
    
    isValidPhone(phone) {
        const value = phone.replace(/-/g, '');
        return /^[0-9]{9}$/.test(value);
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    
    parseDate(dateString) {
        if (!dateString) return null;
        
        const parts = dateString.split('.');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        
        if (isNaN(date.getTime())) return null;
        if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
            return null;
        }
        
        return date;
    }
    
    showTermsModal() {
        const termsModal = document.getElementById('termsModal');
        if (termsModal) {
            termsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideTermsModal() {
        const termsModal = document.getElementById('termsModal');
        if (termsModal) {
            termsModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    acceptTerms() {
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox) {
            termsCheckbox.checked = true;
        }
        this.hideTermsModal();
        this.showSuccess('Соглашение принято');
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
                const icon = hint.querySelector('i');
                hint.textContent = message;
                hint.style.color = isValid ? '#27ae60' : '#e74c3c';
                
                if (icon) {
                    icon.className = isValid ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
                    icon.style.color = isValid ? '#27ae60' : '#e74c3c';
                }
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
    
    // === ОБНОВЛЕННЫЙ МЕТОД SUBMIT FORM С ЧИСЛОВЫМ ID ===
    
    async submitForm(e) {
        e.preventDefault();
        
        if (!this.validateStep(3)) {
            return;
        }
        
        this.saveStepData(3);
        
        const submitBtn = document.getElementById('submitRegistration');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
            submitBtn.disabled = true;
        }
        
        try {
            // Формируем полное имя в формате вашего db.json
            const name = this.userData.middleName ? 
                `${this.userData.lastName} ${this.userData.firstName} ${this.userData.middleName}` :
                `${this.userData.lastName} ${this.userData.firstName}`;
            
            // Формируем номер телефона с кодом страны в формате +375 XX XXX XX XX
            const formattedPhone = this.userData.phone;
            const phoneNumber = `+375 ${formattedPhone.substring(0, 2)} ${formattedPhone.substring(2, 5)} ${formattedPhone.substring(5, 7)} ${formattedPhone.substring(7, 9)}`;
            
            // Генерируем случайный аватар
            const randomAvatarId = Math.floor(Math.random() * 70) + 1;
            const avatar = `https://i.pravatar.cc/150?img=${randomAvatarId}`;
            
            // Получаем текущую дату
            const today = new Date();
            const registrationDate = today.toISOString().split('T')[0];
            
            // Проверяем уникальность email (еще раз для безопасности)
            const emailCheck = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(this.userData.email)}`);
            const existingUsersWithEmail = await emailCheck.json();
            
            if (existingUsersWithEmail.length > 0) {
                throw new Error('Пользователь с таким email уже существует');
            }
            
            // Проверяем уникальность username
            const usernameCheck = await fetch(`http://localhost:3000/users?username=${this.userData.username}`);
            const existingUsersWithUsername = await usernameCheck.json();
            
            if (existingUsersWithUsername.length > 0) {
                throw new Error('Пользователь с таким username уже существует');
            }
            
            // Сначала получаем всех пользователей, чтобы определить следующий ID
            const allUsersResponse = await fetch('http://localhost:3000/users');
            const allUsers = await allUsersResponse.json();
            
            // Определяем следующий числовой ID
            const maxId = Math.max(...allUsers.map(user => parseInt(user.id) || 0));
            const nextId = maxId + 1;
            
            // Подготавливаем данные пользователя в формате вашего db.json
            const userData = {
                id: nextId, // Явно указываем числовой ID
                email: this.userData.email,
                password: this.userData.password,
                name: name,
                avatar: avatar,
                phone: phoneNumber,
                address: "", // Оставляем пустым
                registrationDate: registrationDate,
                username: this.userData.username,
                birthDate: this.userData.birthDate,
                acceptedTerms: this.userData.acceptedTerms,
                isActive: true
            };
            
            console.log('📤 Отправляем данные:', userData);
            
            // Отправляем POST запрос на JSON Server
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const savedUser = await response.json();
            console.log('✅ Пользователь сохранен:', savedUser);
            
            this.showSuccess(`Регистрация успешна! Ваш логин: ${this.userData.email}`);
            
            // Очищаем форму
            this.resetForm();
            
            // Перенаправляем на страницу входа через 3 секунды
            setTimeout(() => {
                window.location.href = 'login.html?registered=true&email=' + encodeURIComponent(this.userData.email);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            
            let errorMessage = 'Ошибка регистрации. Попробуйте еще раз.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Сервер недоступен. Убедитесь, что JSON Server запущен на localhost:3000';
            } else if (error.message.includes('уже существует')) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        } finally {
            const submitBtn = document.getElementById('submitRegistration');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Зарегистрироваться';
                submitBtn.disabled = false;
            }
        }
    }
    
    resetForm() {
        const form = document.getElementById('registerForm');
        if (form) {
            form.reset();
        }
        
        this.currentStep = 1;
        this.usernameAttempts = 5;
        this.userData = {
            firstName: '',
            lastName: '',
            middleName: '',
            birthDate: '',
            phone: '',
            email: '',
            password: '',
            username: '',
            acceptedTerms: false
        };
        
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active'));
        
        const firstStep = document.getElementById('step1');
        const firstProgress = document.querySelector('.progress-step[data-step="1"]');
        
        if (firstStep) firstStep.classList.add('active');
        if (firstProgress) firstProgress.classList.add('active');
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        if (errorMessage) {
            errorMessage.innerHTML = message;
            errorMessage.classList.add('show');
        }
        
        if (successMessage) {
            successMessage.classList.remove('show');
        }
        
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.classList.remove('show');
            }
        }, 5000);
    }
    
    showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');
        
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.add('show');
        }
        
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
        
        setTimeout(() => {
            if (successMessage) {
                successMessage.classList.remove('show');
            }
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.registrationManager = new RegistrationManager();
});