// app.js - Главный файл
console.log("🚀 app.js loaded");

class CharityApp {
    constructor() {
        this.backendUrl = 'http://127.0.0.1:8000/api';
        this.helpRequests = [];
        this.currentUser = null;
        
        this.ui = new UIManager(this);
        this.api = new ApiService(this);
        this.map = new MapManager(this);
        this.auth = new AuthManager(this);
        
        console.log("✅ CharityApp created");
        this.init();
    }

    async init() {
        console.log("🔧 Initializing app...");
        
        this.ui.initNavigation();
        this.ui.initButtons();
        this.ui.initModal();
        this.auth.initAuthModal();
        
        await this.auth.checkAuthStatus();
        await this.api.loadHelpRequests();
        await this.api.loadFunds();
        
        this.map.initYandexMaps();
        
        console.log("✅ App initialized successfully");
    }

    showCreateRequestForm() {
        if (!this.currentUser) {
            this.ui.showModal('Требуется авторизация', 
                '<p>Для создания заявки необходимо войти в систему</p>' +
                '<button class="btn-primary" onclick="window.app.auth.showAuthModal(\'login\'); window.app.ui.hideModal()">Войти</button>'
            );
            return;
        }
        
        // Только обычные пользователи могут создавать заявки
        if (this.currentUser.role !== 'user' && this.currentUser.role) {
            this.ui.showModal('Недоступно', 
                '<p>Создание заявок на помощь доступно только для обычных пользователей</p>' +
                '<p style="color: #666; margin-top: 0.5rem;">Аккаунты фондов могут только просматривать карту</p>'
            );
            return;
        }
        
        const formHtml = `
            <form id="create-request-form">
                <div class="form-group">
                    <label>Заголовок:</label>
                    <input type="text" name="title" placeholder="Краткое описание" required>
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea name="description" placeholder="Подробное описание потребности" required></textarea>
                </div>
                <div class="form-group">
                    <label>Категория:</label>
                    <select name="category" required>
                        <option value="food">🍎 Еда</option>
                        <option value="clothes">👕 Одежда</option>
                        <option value="medicine">💊 Лекарства</option>
                        <option value="household">🏠 Хозтовары</option>
                        <option value="other">❔ Другое</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Срочность:</label>
                    <select name="urgency" required>
                        <option value="low">📗 Не срочно</option>
                        <option value="medium">📐 Средняя</option>
                        <option value="high">📙 Срочно</option>
                        <option value="critical">📕 Очень срочно</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Адрес:</label>
                    <input type="text" id="address-input" name="address" placeholder="Москва, улица Тверская, 1" required>
                    <button type="button" class="btn-secondary" onclick="window.app.geocodeAddress()" style="margin-top: 5px;">
                        🔍 Найти на карте
                    </button>
                </div>
                <div class="form-group" style="display: none;">
                    <label>Широта:</label>
                    <input type="number" name="latitude" id="latitude-input" step="any" value="55.7558" required>
                </div>
                <div class="form-group" style="display: none;">
                    <label>Долгота:</label>
                    <input type="number" name="longitude" id="longitude-input" step="any" value="37.6173" required>
                </div>
                <div id="map-preview" style="height: 200px; margin: 10px 0; display: none; border-radius: 8px;"></div>
                <div class="form-group">
                    <label>Контактное лицо:</label>
                    <input type="text" name="contact_name" placeholder="Ваше имя" value="${this.currentUser.username}" required>
                </div>
                <div class="form-group">
                    <label>Телефон:</label>
                    <input type="tel" name="contact_phone" placeholder="+7 XXX XXX-XX-XX" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" name="contact_email" placeholder="email@example.com" value="${this.currentUser.email || ''}">
                </div>
                <div style="gap: 1rem; margin-top: 1rem;">
                    <button type="submit" class="btn-primary">Создать заявку</button>
                </div>
            </form>
        `;
        
        this.ui.showModal('Создать заявку', formHtml);
        
        setTimeout(() => {
            const form = document.getElementById('create-request-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleCreateRequestSubmit(e));
            }
        }, 100);
    }

    async geocodeAddress() {
        const addressInput = document.getElementById('address-input');
        const address = addressInput.value.trim();
        
        if (!address) {
            alert('Введите адрес');
            return;
        }
        
        try {
            const result = await ymaps.geocode(address);
            const firstGeoObject = result.geoObjects.get(0);
            
            if (!firstGeoObject) {
                alert('Адрес не найден. Попробуйте уточнить.');
                return;
            }
            
            const coords = firstGeoObject.geometry.getCoordinates();
            
            document.getElementById('latitude-input').value = coords[0];
            document.getElementById('longitude-input').value = coords[1];
            
            const mapPreview = document.getElementById('map-preview');
            mapPreview.style.display = 'block';
            mapPreview.innerHTML = '';
            
            const previewMap = new ymaps.Map('map-preview', {
                center: coords,
                zoom: 15
            });
            
            previewMap.geoObjects.add(new ymaps.Placemark(coords, {
                balloonContent: address
            }));
            
            alert('✅ Адрес найден на карте!');
            
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            alert('Ошибка поиска адреса. Проверьте подключение к интернету.');
        }
    }

    async handleCreateRequestSubmit(event) {
        event.preventDefault();
        
        if (!this.currentUser) {
            this.auth.showAuthModal('login');
            return;
        }

        const formData = new FormData(event.target);
        const requestData = Object.fromEntries(formData.entries());
        
        requestData.latitude = parseFloat(requestData.latitude);
        requestData.longitude = parseFloat(requestData.longitude);

        try {
            await this.api.createHelpRequest(requestData);
            this.ui.hideModal();
            await this.api.loadHelpRequests();
            this.map.updateMapMarkers();
            this.ui.showModal('Успех', '✅ Заявка успешно создана!');
        } catch (error) {
            this.ui.showModal('Ошибка', '❌ Не удалось создать заявку: ' + error.message);
        }
    }

    async showFundDetails(fundId) {
        console.log('📋 Загружаем детали фонда:', fundId);
        
        try {
            // Загружаем информацию о фонде
            const fundResponse = await fetch(`${this.backendUrl}/funds/${fundId}/`);
            const fund = await fundResponse.json();
            
            // Загружаем сборы этого фонда
            const fundraisersResponse = await fetch(`${this.backendUrl}/fundraisers/?fund=${fundId}`);
            const fundraisers = await fundraisersResponse.json();
            
            let html = `
                <div style="text-align: left;">
                    <h3 style="margin-bottom: 1rem;">${fund.name}</h3>
                    <p style="color: #666; margin-bottom: 1rem; line-height: 1.5;">${fund.description}</p>
                    
                    ${fund.website ? `<p style="margin-bottom: 0.5rem;"><a href="${fund.website}" target="_blank" style="color: #667eea;">🌐 Перейти на сайт</a></p>` : ''}
                    ${fund.contact_email ? `<p style="margin-bottom: 0.5rem;">📧 ${fund.contact_email}</p>` : ''}
                    
                    <hr style="margin: 1.5rem 0; border: none; border-top: 2px solid #e9ecef;">
                    
                    <h4 style="margin-bottom: 1rem;">💰 Активные сборы (${fundraisers.length})</h4>
            `;
            
            if (fundraisers.length === 0) {
                html += '<p style="color: #999; padding: 2rem; text-align: center; background: #f8f9fa; border-radius: 8px;">У этого фонда пока нет активных сборов</p>';
            } else {
                fundraisers.forEach(fr => {
                    html += `
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 0.5rem;">${fr.title}</h4>
                            <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">${fr.description}</p>
                            <div style="background: #e9ecef; border-radius: 10px; height: 20px; margin: 1rem 0; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${fr.progress_percentage}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span><strong>${fr.current_amount} ₽</strong> собрано</span>
                                <span>Цель: <strong>${fr.goal_amount} ₽</strong></span>
                            </div>
                            <p style="font-size: 0.85rem; color: #666;">Окончание: ${new Date(fr.end_date).toLocaleDateString('ru-RU')}</p>
                        </div>
                    `;
                });
            }
            
            html += '</div>';
            
            this.ui.showModal(`Фонд: ${fund.name}`, html);
            
        } catch (error) {
            console.error('Ошибка загрузки деталей фонда:', error);
            this.ui.showModal('Ошибка', 'Не удалось загрузить информацию о фонде');
        }
    }

    showCreateFundraiserForm(fundId) {
        const formHtml = `
            <form id="create-fundraiser-form">
                <input type="hidden" name="fund" value="${fundId}">
                <div class="form-group">
                    <label>Название сбора:</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea name="description" required></textarea>
                </div>
                <div class="form-group">
                    <label>Цель сбора (₽):</label>
                    <input type="number" name="goal_amount" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label>Дата начала:</label>
                    <input type="datetime-local" name="start_date" required>
                </div>
                <div class="form-group">
                    <label>Дата окончания:</label>
                    <input type="datetime-local" name="end_date" required>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="button" class="btn-secondary" onclick="window.app.ui.hideModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Создать сбор</button>
                </div>
            </form>
        `;
        
        this.ui.showModal('Создать сбор средств', formHtml);
        
        setTimeout(() => {
            const form = document.getElementById('create-fundraiser-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        await this.api.createFundraiser(data);
                        this.ui.hideModal();
                        this.ui.showModal('Успех', '✅ Сбор успешно создан!');
                        this.auth.loadProfilePage();
                    } catch (error) {
                        this.ui.showModal('Ошибка', '❌ ' + error.message);
                    }
                });
            }
        }, 100);
    }

    async approveFund(fundId) {
        if (!confirm('Вы уверены, что хотите одобрить этот фонд?')) {
            return;
        }
        
        try {
            await this.api.approveFund(fundId);
            this.ui.showModal('Успех', '✅ Фонд одобрен!');
            this.auth.loadProfilePage();
        } catch (error) {
            this.ui.showModal('Ошибка', '❌ ' + error.message);
        }
    }

    async rejectFund(fundId) {
        const reason = prompt('Укажите причину отклонения:');
        
        if (!reason) {
            return;
        }
        
        try {
            await this.api.rejectFund(fundId, reason);
            this.ui.showModal('Успех', '✅ Фонд отклонен');
            this.auth.loadProfilePage();
        } catch (error) {
            this.ui.showModal('Ошибка', '❌ ' + error.message);
        }
    }

    getCategoryDisplay(category) {
        const categories = {
            'food': '🍎 Еда',
            'clothes': '👕 Одежда', 
            'medicine': '💊 Лекарства',
            'household': '🏠 Хозтовары',
            'other': '❔ Другое'
        };
        return categories[category] || category;
    }

    getUrgencyDisplay(urgency) {
        const urgencies = {
            'low': '📗 Не срочно',
            'medium': '📐 Средняя',
            'high': '📙 Срочно', 
            'critical': '📕 Очень срочно'
        };
        return urgencies[urgency] || urgency;
    }
}

// Глобальные функции
function showAuthModal(type) {
    if (window.app) window.app.auth.showAuthModal(type);
}

function closeAuthModal() {
    if (window.app) window.app.auth.closeAuthModal();
}

function switchAuthForm(type) {
    if (window.app) window.app.auth.switchAuthForm(type);
}

function checkAuthBeforeCreate() {
    if (window.app) window.app.showCreateRequestForm();
}

function showProfilePage() {
    if (window.app) {
        window.app.ui.showPage('profile');
        window.app.auth.loadProfilePage();
    }
}

function logout() {
    if (window.app) window.app.auth.logout();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, starting app...");
    window.app = new CharityApp();
});