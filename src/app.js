// app.js - Главный файл
console.log("🚀 app.js loaded");

class CharityApp {
    constructor() {
        this.backendUrl = 'http://127.0.0.1:8000/api';
        this.helpRequests = [];
        this.currentUser = null;
        
        // Инициализируем менеджеры
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
        
        // Проверяем авторизацию
        await this.auth.checkAuthStatus();
        
        // Загружаем данные
        await this.api.loadHelpRequests();
        await this.api.loadFunds();
        
        // Инициализируем карту
        this.map.initYandexMaps();
        
        console.log("✅ App initialized successfully");
    }

    showCreateRequestForm() {
        // ИСПРАВЛЕНО: правильная проверка авторизации
        if (!this.currentUser) {
            this.ui.showModal('Требуется авторизация', 
                '<p>Для создания заявки необходимо войти в систему</p>' +
                '<button class="btn-primary" style="margin-top: 1rem;" onclick="window.app.auth.showAuthModal(\'login\'); window.app.ui.hideModal()">Войти</button>'
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
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="submit" class="btn-primary">Создать заявку</button>
                </div>
            </form>
        `;
        
        this.ui.showModal('Создать заявку', formHtml);
        
        // Добавляем обработчик формы
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
            
            // Устанавливаем координаты
            document.getElementById('latitude-input').value = coords[0];
            document.getElementById('longitude-input').value = coords[1];
            
            // Показываем превью карты
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
        
        // Преобразуем координаты в числа
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

    // Вспомогательные методы для отображения
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

function showProfileModal() {
    if (window.app) window.app.auth.showProfileModal();
}

function logout() {
    if (window.app) window.app.auth.logout();
}
function loadProfilePage() {
    if (window.app) window.app.auth.loadProfilePage();
}
// Запуск приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, starting app...");
    window.app = new CharityApp();
});