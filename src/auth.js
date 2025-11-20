// auth.js - Авторизация
class AuthService {
    static setTokens(data) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    
    static getAccessToken() {
        return localStorage.getItem('access_token');
    }
    
    static getUserData() {
        try {
            const userData = localStorage.getItem('user_data');
            if (!userData || userData === 'undefined' || userData === 'null') {
                return null;
            }
            return JSON.parse(userData);
        } catch (error) {
            console.error('❌ Ошибка парсинга user_data:', error);
            return null;
        }
    }
    
    static removeTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    }
}

class AuthManager {
    constructor(app) {
        this.app = app;
    }

    async checkAuthStatus() {
        const token = AuthService.getAccessToken();
        const userData = AuthService.getUserData();
        
        if (token && userData) {
            this.app.currentUser = userData;
            this.updateAuthUI();
            console.log("✅ Пользователь авторизован:", this.app.currentUser.username);
        } else {
            this.app.currentUser = null;
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        const usernameDisplay = document.getElementById('username-display');
        const createRequestBtn = document.getElementById('create-request-btn');

        if (this.app.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (usernameDisplay) usernameDisplay.textContent = this.app.currentUser.username;
            if (createRequestBtn) {
                createRequestBtn.disabled = false;
                createRequestBtn.style.opacity = '1';
                createRequestBtn.style.cursor = 'pointer';
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (createRequestBtn) {
                createRequestBtn.disabled = false; // ИСПРАВЛЕНО: кнопка всегда активна
                createRequestBtn.style.opacity = '1';
                createRequestBtn.style.cursor = 'pointer';
            }
        }
    }

    showAuthModal(type = 'login') {
        this.switchAuthForm(type);
        document.getElementById('auth-modal').style.display = 'flex';
    }

    closeAuthModal() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('auth-error').style.display = 'none';
    }

    switchAuthForm(type) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');

        if (type === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authTitle.textContent = 'Вход в систему';
            submitBtn.textContent = 'Войти';
            switchToRegister.style.display = 'block';
            switchToLogin.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitle.textContent = 'Регистрация';
            submitBtn.textContent = 'Зарегистрироваться';
            switchToRegister.style.display = 'none';
            switchToLogin.style.display = 'block';
        }
    }

    initAuthModal() {
        const authModal = document.getElementById('auth-modal');
        const authForm = document.getElementById('auth-form');
        const submitBtn = document.getElementById('auth-submit-btn');
        const closeBtn = authModal.querySelector('.close');

        closeBtn.addEventListener('click', () => this.closeAuthModal());
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) this.closeAuthModal();
        });
        
        // Обработчик на кнопку
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleAuthSubmit(e);
        });
    }

    async handleAuthSubmit(event) {
        event.preventDefault();
        const authTitle = document.getElementById('auth-modal-title');
        const isLogin = authTitle.textContent === 'Вход в систему';
        
        const errorDiv = document.getElementById('auth-error');
        errorDiv.style.display = 'none';

        try {
            const formData = {
                username: document.getElementById(isLogin ? 'login-username' : 'register-username').value,
                email: document.getElementById('register-email')?.value || '',
                password: document.getElementById(isLogin ? 'login-password' : 'register-password').value,
                password2: document.getElementById('register-password2')?.value || ''
            };

            if (!isLogin) {
                const errors = [];
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    errors.push('Введите правильный email');
                }
                
                if (formData.password.length < 6) {
                    errors.push('Пароль должен содержать минимум 6 символов');
                }
                
                if (formData.password !== formData.password2) {
                    errors.push('Пароли не совпадают');
                }
                
                if (errors.length > 0) {
                    throw new Error(errors.join(', '));
                }
            }

            let result;
            if (isLogin) {
                result = await this.login(formData);
            } else {
                result = await this.register(formData);
            }

            if (result.error) {
                throw new Error(result.error);
            }

            this.app.currentUser = result.user;
            AuthService.setTokens(result);
            
            this.updateAuthUI();
            this.closeAuthModal();
            this.app.ui.showModal('Успех', `✅ ${isLogin ? 'Вход выполнен' : 'Регистрация завершена'}!`);
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }

    async register(userData) {
        console.log('📝 Регистрация:', userData);
        
        const required = ['username', 'email', 'password', 'password2'];
        const missing = required.filter(field => !userData[field]);
        if (missing.length > 0) {
            return {error: `Отсутствуют поля: ${missing.join(', ')}`};
        }

        try {
            const response = await fetch(`${this.app.backendUrl}/auth/register/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                return {error: result.detail || JSON.stringify(result)};
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            return {error: 'Ошибка сети'};
        }
    }

    async login(credentials) {
        const response = await fetch(`${this.app.backendUrl}/auth/login/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(credentials)
        });
        return await response.json();
    }

    logout() {
        this.app.currentUser = null;
        AuthService.removeTokens();
        this.updateAuthUI();
        this.app.ui.showModal('Выход', '✅ Вы успешно вышли из системы');
    }

    async showProfileModal() {
        if (!this.app.currentUser) {
            this.showAuthModal('login');
            return;
        }
        
        // Загружаем заявки пользователя
        try {
            const token = AuthService.getAccessToken();
            const response = await fetch(`${this.app.backendUrl}/my-requests/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки заявок');
            }
            
            const requests = await response.json();
            
            let requestsHtml = '';
            if (requests.length === 0) {
                requestsHtml = '<p style="color: #999;">У вас пока нет заявок</p>';
            } else {
                requestsHtml = requests.map(req => `
                    <div class="request-item">
                        <div class="request-header">
                            <div class="request-title">${req.title}</div>
                            <div class="request-status ${req.is_fulfilled ? 'status-fulfilled' : 'status-active'}">
                                ${req.is_fulfilled ? '✅ Выполнена' : '🔄 Активна'}
                            </div>
                        </div>
                        <div class="request-meta">
                            <span>${this.app.getCategoryDisplay(req.category)}</span>
                            <span>${this.app.getUrgencyDisplay(req.urgency)}</span>
                            <span>📍 ${req.address}</span>
                        </div>
                        <div class="request-description">${req.description}</div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                            Создана: ${new Date(req.created_at).toLocaleDateString('ru-RU')}
                        </div>
                    </div>
                `).join('');
            }
            
            const profileHtml = `
                <div style="text-align: left;">
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">Информация о профиле</h4>
                        <p><strong>Имя пользователя:</strong> ${this.app.currentUser.username}</p>
                        <p><strong>Email:</strong> ${this.app.currentUser.email || 'Не указан'}</p>
                    </div>
                    <h4 style="margin-bottom: 1rem;">Мои заявки</h4>
                    ${requestsHtml}
                </div>
            `;
            
            this.app.ui.showModal('Личный кабинет', profileHtml);
            
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            this.app.ui.showModal('Ошибка', '❌ Не удалось загрузить данные профиля');
        }
    }

    getAccessToken() {
        return AuthService.getAccessToken();
    }
}