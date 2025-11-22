// auth.js - Авторизация и личные кабинеты
class AuthService {
    static setTokens(data) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        console.log('💾 Токены сохранены. Роль:', data.user.role);
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
            const parsed = JSON.parse(userData);
            console.log('📖 Загружены данные пользователя:', parsed);
            return parsed;
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
        
        console.log('🔐 Проверка авторизации...');
        console.log('   Токен:', token ? 'Есть' : 'Нет');
        console.log('   Данные:', userData);
        
        if (token && userData) {
            this.app.currentUser = userData;
            this.updateAuthUI();
            console.log("✅ Пользователь авторизован:", this.app.currentUser.username, "Роль:", this.app.currentUser.role);
        } else {
            this.app.currentUser = null;
            this.updateAuthUI();
            console.log("❌ Пользователь не авторизован");
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
            if (usernameDisplay) {
                // Добавляем иконку в зависимости от роли
                const roleIcons = {
                    'user': '👤',
                    'fund_creator': '🏛️',
                    'admin': '⭐'
                };
                const icon = roleIcons[this.app.currentUser.role] || '👤';
                usernameDisplay.textContent = `${icon} ${this.app.currentUser.username}`;
            }
            
            // Кнопка создания заявки только для обычных пользователей
            if (createRequestBtn) {
                if (this.app.currentUser.role === 'user') {
                    createRequestBtn.style.display = 'inline-block';
                } else {
                    createRequestBtn.style.display = 'none';
                }
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (createRequestBtn) {
                createRequestBtn.style.display = 'inline-block';
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
        const submitBtn = document.getElementById('auth-submit-btn');
        const closeBtn = authModal.querySelector('.close');

        closeBtn.addEventListener('click', () => this.closeAuthModal());
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) this.closeAuthModal();
        });
        
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
                password2: document.getElementById('register-password2')?.value || '',
                account_type: document.getElementById('register-account-type')?.value || 'user',
                fund_name: document.getElementById('register-fund-name')?.value || '',
                fund_description: document.getElementById('register-fund-description')?.value || ''
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
                
                // Проверка полей фонда
                if (formData.account_type === 'fund') {
                    if (!formData.fund_name || formData.fund_name.trim() === '') {
                        errors.push('Укажите название фонда');
                    }
                    if (!formData.fund_description || formData.fund_description.trim() === '') {
                        errors.push('Укажите описание фонда');
                    }
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
            
            let successMessage = '✅ Вход выполнен!';
            if (!isLogin) {
                if (formData.account_type === 'fund') {
                    successMessage = `✅ Регистрация завершена!<br><br>
                        <strong>Ваш фонд "${formData.fund_name}" отправлен на проверку администратору.</strong><br><br>
                        После одобрения вы сможете создавать сборы средств.`;
                } else {
                    successMessage = '✅ Регистрация завершена! Теперь вы можете создавать заявки на помощь.';
                }
            }
            
            this.app.ui.showModal('Успех', `<p>${successMessage}</p>`);
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.app.backendUrl}/auth/register/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    password2: userData.password2,
                    account_type: userData.account_type,
                    fund_name: userData.fund_name || '',
                    fund_description: userData.fund_description || ''
                })
            });
            
            const result = await response.json();
            console.log('📡 Ответ регистрации:', result);
            
            if (!response.ok) {
                return {error: result.detail || JSON.stringify(result)};
            }
            
            return await this.login({username: userData.username, password: userData.password});
            
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
        const result = await response.json();
        console.log('🔑 Результат логина:', result);
        return result;
    }

    logout() {
        this.app.currentUser = null;
        AuthService.removeTokens();
        this.updateAuthUI();
        this.app.ui.showPage('map');
        this.app.ui.showModal('Выход', '✅ Вы успешно вышли из системы');
    }

    async loadProfilePage() {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 ЗАГРУЗКА ЛИЧНОГО КАБИНЕТА');
        console.log('='.repeat(50));

        const role = this.app.currentUser.role || 'user';
        console.log('👤 Пользователь:', this.app.currentUser.username);
        console.log('🎭 Роль:', role);
        
        const profileContent = document.getElementById('profile-page');
        console.log(profileContent)
        profileContent.innerHTML = '<p style="text-align: center; padding: 2rem;">⏳ Загрузка данных...</p>';
        
        let content = '<div class="container">';
        
        // Информация о пользователе
        content += `
            <div class="user-data">
                <h3>👤 Информация о профиле</h3>
                <div class="profile-info">
                    <p><strong>Имя пользователя:</strong> ${this.app.currentUser.username}</p>
                    <p><strong>Email:</strong> ${this.app.currentUser.email || 'Не указан'}</p>
                    <p><strong>Тип аккаунта:</strong> ${this.getRoleDisplay(role)}</p>
                    <p><strong>ID:</strong> ${this.app.currentUser.id}</p>
                </div>
            </div>
        `;

        try {
            const token = AuthService.getAccessToken();
            console.log('🔑 Токен:', token ? token.substring(0, 20) + '...' : 'НЕТ');
            
            if (!token) {
                throw new Error('Токен отсутствует. Войдите заново.');
            }
            
            // МАРШРУТИЗАЦИЯ ПО РОЛЯМ
            console.log('\n📊 Определение типа кабинета...');
            
            if (role === 'admin') {
                console.log('⭐ Загружаем кабинет АДМИНИСТРАТОРА');
                const pendingFunds = await this.loadPendingFunds(token);
                content += this.renderAdminContent(pendingFunds);
            } 
            else if (role === 'fund_creator') {
                console.log('🏛️ Загружаем кабинет СОЗДАТЕЛЯ ФОНДА');
                const funds = await this.loadUserFunds(token);
                const fundraisers = await this.loadUserFundraisers(token);
                content += this.renderFundCreatorContent(funds, fundraisers);
            } 
            else {
                console.log('👤 Загружаем кабинет ОБЫЧНОГО ПОЛЬЗОВАТЕЛЯ');
                const requests = await this.loadUserRequests(token);
                content += this.renderUserRequests(requests);
            }
            
            console.log('✅ Данные загружены успешно');
            
        } catch (error) {
            console.error('❌ ОШИБКА загрузки данных:', error);
            content += `
                <div class="profile-section">
                    <div style="background: #fee; border: 2px solid #f88; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
                        <h4 style="color: #c00; margin-bottom: 0.5rem;">❌ Ошибка загрузки данных</h4>
                        <p style="color: #666; margin-bottom: 0.5rem;"><strong>Сообщение:</strong> ${error.message}</p>
                        <p style="color: #666; font-size: 0.9rem;">Откройте консоль браузера (F12) для подробностей</p>
                        <button class="btn-primary" onclick="window.app.auth.logout()" style="margin-top: 1rem;">Выйти и войти заново</button>
                    </div>
                </div>
            `;
        }
        
        profileContent.innerHTML = content+'</div>';
        console.log('✅ Интерфейс отрисован');
        console.log('='.repeat(50) + '\n');
    }

    getRoleDisplay(role) {
        const roles = {
            'user': '👤 Обычный пользователь (может создавать заявки на помощь)',
            'fund_creator': '🏛️ Создатель фонда (управляет фондами и сборами)',
            'admin': '⭐ Администратор (проверяет заявки на фонды)'
        };
        return roles[role] || '👤 Обычный пользователь';
    }

    async loadUserRequests(token) {
        console.log('  📥 Загружаем заявки пользователя...');
        const url = `${this.app.backendUrl}/my-requests/`;
        console.log('  🔗 URL:', url);
        
        const response = await fetch(url, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        console.log('  📡 Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('  ❌ Ошибка:', errorText);
            throw new Error(`Ошибка ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        const requests = Array.isArray(data) ? data : (data.results || []);
        console.log('  ✅ Загружено заявок:', requests.length);
        
        return requests;
    }

    async loadUserFunds(token) {
        console.log('  📥 Загружаем фонды пользователя...');
        const response = await fetch(`${this.app.backendUrl}/my-funds/`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки фондов: ${response.status}`);
        }
        
        const data = await response.json();
        const funds = Array.isArray(data) ? data : (data.results || []);
        console.log('  ✅ Загружено фондов:', funds.length);
        return funds;
    }

    async loadUserFundraisers(token) {
        console.log('  📥 Загружаем сборы пользователя...');
        const response = await fetch(`${this.app.backendUrl}/my-fundraisers/`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки сборов: ${response.status}`);
        }
        
        const data = await response.json();
        const fundraisers = Array.isArray(data) ? data : (data.results || []);
        console.log('  ✅ Загружено сборов:', fundraisers.length);
        return fundraisers;
    }

    async loadPendingFunds(token) {
        console.log('  📥 Загружаем фонды на проверке...');
        const response = await fetch(`${this.app.backendUrl}/admin/pending-funds/`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        console.log('  📡 Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('  ❌ Ошибка:', errorText);
            throw new Error(`Ошибка загрузки фондов: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('  📦 Полученные данные:', data);
        
        const funds = Array.isArray(data) ? data : (data.results || []);
        console.log('  ✅ Загружено фондов на проверке:', funds.length);
        return funds;
    }

    renderUserRequests(requests) {
        console.log('🎨 Рендерим заявки пользователя. Количество:', requests.length);
        
        let html = `
            <div class="user-data" style="text-align: center">
                <h3>📋 Мои заявки на помощь</h3>
        `;
        
        if (!Array.isArray(requests) || requests.length === 0) {
            html += `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 2rem; text-align: center; margin: 1rem 0;">
                    <p style="color: #666; margin-bottom: 1rem;">У вас пока нет заявок</p>
                    <button class="btn-primary" onclick="window.app.ui.showPage('map'); window.app.showCreateRequestForm();">
                        ➕ Создать первую заявку
                    </button>
                </div>
            `;
        } else {
            html += requests.map(req => `
                <div class="request-item">
                    <div class="request-header">
                        <div class="request-title">${req.title}</div>
                        <div class="request-status ${req.is_fulfilled ? 'status-fulfilled' : 'status-active'}">
                            ${req.is_fulfilled ? '✅ Выполнена' : '🔄 Активна'}
                        </div>
                    </div>
                    <div class="request-meta">
                        <span>${req.category_display || this.app.getCategoryDisplay(req.category)}</span>
                        <span>${req.urgency_display || this.app.getUrgencyDisplay(req.urgency)}</span>
                        <span>📍 ${req.address}</span>
                    </div>
                    <div class="request-description">${req.description}</div>
                    <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                        Создана: ${new Date(req.created_at).toLocaleDateString('ru-RU')}
                    </div>
                </div>
            `).join('');
        }
        
        html += '</div>';
        return html;
    }

    renderFundCreatorContent(funds, fundraisers) {
        console.log('🎨 Рендерим контент создателя фонда');
        
        let html = `
            <div class="user-data">
                <h3>🏛️ Мои фонды</h3>
        `;
        
        if (!Array.isArray(funds) || funds.length === 0) {
            html += '<p style="color: #999;">У вас пока нет одобренных фондов</p>';
        } else {
            html += funds.map(fund => `
                <div class="request-item">
                    <div class="fund-header">
                        <h4>${fund.name}</h4>
                        <span class="fund-status status-${fund.status}">${this.getStatusDisplay(fund.status)}</span>
                    </div>
                    <p>${fund.description}</p>
                    ${fund.status === 'rejected' ? `<p style="color: red; margin-top: 0.5rem;"><strong>Причина отклонения:</strong> ${fund.rejection_reason || 'Не указана'}</p>` : ''}
                    ${fund.status === 'approved' ? `<button class="btn-secondary" onclick="window.app.showCreateFundraiserForm(${fund.id})" style="margin-top: 0.5rem;">➕ Создать сбор</button>` : ''}
                </div>
            `).join('');
        }
        
        html += '</div><div class="user-data"><h3>💰 Мои сборы</h3>';
        
        if (!Array.isArray(fundraisers) || fundraisers.length === 0) {
            html += '<p style="color: #999;">У вас пока нет активных сборов</p>';
        } else {
            html += fundraisers.map(fr => `
                <div class="fundraiser-item">
                    <h4>${fr.title}</h4>
                    <p style="color: #666;">${fr.fund_name}</p>
                    <div class="progress-bar" style="background: #e9ecef; border-radius: 10px; height: 20px; margin: 1rem 0;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${fr.progress_percentage}%;"></div>
                    </div>
                    <p><strong>${fr.current_amount}</strong> ₽ из <strong>${fr.goal_amount}</strong> ₽</p>
                </div>
            `).join('');
        }
        
        html += '</div>';
        return html;
    }

    renderAdminContent(pendingFunds) {
        console.log('🎨 Рендерим контент админа. Фондов:', pendingFunds.length);
        
        let html = `
            <div class="user-data" style="text-align: center;">
                <h3>⭐ Панель администратора</h3>
                <h4 style="margin-top: 1rem;">Фонды на проверке (${pendingFunds.length})</h4>
        `;
        
        if (!Array.isArray(pendingFunds) || pendingFunds.length === 0) {
            html += '<div style="background: #d1f2eb; border-radius: 8px; padding: 2rem; text-align: center; margin: 1rem 0;"><p style="color: #0a6e4d;">✅ Нет фондов на проверке</p></div>';
        } else {
            console.log(pendingFunds)
            html += pendingFunds.map(fund => `
                <div class="request-item">
                    <h4>${fund.name}</h4>
                    <p>${fund.description}</p>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">👤 Создатель: <strong>${fund.creator_username}</strong></p>
                    <p style="color: #666; font-size: 0.9rem;">📧 Email: ${fund.contact_email}</p>
                    ${fund.website ? `<p style="color: #666; font-size: 0.9rem;">🌐 Сайт: <a href="${fund.website}" target="_blank">${fund.website}</a></p>` : ''}
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button class="btn-primary" onclick="window.app.api.approveFund(${fund.id})">✅ Одобрить</button>
                        <button class="btn-secondary" onclick="window.app.api.rejectFund(${fund.id})">❌ Отклонить</button>
                    </div>
                </div>
            `).join('');
        }
        
        html += '</div>';
        return html;
    }

    getStatusDisplay(status) {
        const statuses = {
            'pending': '⏳ На проверке',
            'approved': '✅ Одобрен',
            'rejected': '❌ Отклонен'
        };
        return statuses[status] || status;
    }

    getAccessToken() {
        return AuthService.getAccessToken();
    }
}