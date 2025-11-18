// Главный файл приложения
console.log("🚀 Приложение запускается...");

class CharityApp {
    constructor() {
        this.backendUrl = 'http://127.0.0.1:8000/api';
        this.map = null;
        this.placemarks = [];
        this.helpRequests = [];
        this.isMapLoaded = false;
        this.mapRetryCount = 0;
        this.maxMapRetries = 3;
        this.init();
    }

    async init() {
        console.log("Инициализация приложения...");
        
        // Инициализация компонентов
        this.initNavigation();
        this.initButtons();
        this.initModal();
        
        // Загружаем сохраненные заявки
        await this.loadSavedRequests();
        
        // Запускаем проверку Яндекс.Карт
        this.initYandexMaps();
        
        console.log("✅ Приложение инициализировано");
    }

    // Инициализация Яндекс.Карт с повторными попытками
    initYandexMaps() {
        console.log("🔍 Проверяем доступность Яндекс.Карт...");
        
        if (typeof ymaps !== 'undefined') {
            console.log("🗺️ Яндекс.Карты доступны, инициализируем карту");
            this.initMap();
            return;
        }

        // Ждем загрузки Яндекс.Карт
        const checkInterval = setInterval(() => {
            if (typeof ymaps !== 'undefined') {
                clearInterval(checkInterval);
                console.log("🗺️ Яндекс.Карты загружены после ожидания");
                this.initMap();
            }
            
            this.mapRetryCount++;
            if (this.mapRetryCount >= 20) { // 20 попыток по 100мс = 2 секунды
                clearInterval(checkInterval);
                console.error("❌ Яндекс.Карты не загрузились за 2 секунды");
                this.showMapError();
            }
        }, 100);
    }

    // Инициализация карты
    initMap() {
        if (typeof ymaps === 'undefined') {
            console.error("❌ Яндекс.Карты не доступны для инициализации");
            this.showMapError();
            return;
        }

        ymaps.ready(() => {
            console.log("🗺️ Яндекс.Карты готовы к созданию карты");
            
            try {
                const mapElement = document.getElementById('map');
                if (!mapElement) {
                    console.error("❌ Элемент карты не найден");
                    return;
                }

                // Очищаем контейнер
                mapElement.innerHTML = '';
                
                // Создаем карту
                this.map = new ymaps.Map('map', {
                    center: [55.7558, 37.6173], // Москва
                    zoom: 10,
                    controls: ['zoomControl', 'fullscreenControl', 'searchControl']
                }, {
                    searchControlProvider: 'yandex#search'
                });

                this.isMapLoaded = true;
                console.log("✅ Карта успешно создана");

                // Обработчик клика по карте для создания заявки
                this.map.events.add('click', (e) => {
                    const coords = e.get('coords');
                    console.log('Клик по карте:', coords);
                    this.showCreateRequestFormWithCoords(coords);
                });

                // Загружаем заявки на карту
                this.updateMapMarkers();

            } catch (error) {
                console.error("❌ Критическая ошибка при создании карты:", error);
                this.showMapError();
            }
        });
    }

    // Показать ошибку загрузки карты
    showMapError() {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="padding: 2rem; text-align: center; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                    <h3 style="color: #856404;">⚠️ Временные проблемы с картой</h3>
                    <p>Функциональность заявок работает, но карта временно недоступна.</p>
                    <p>Загружено заявок: <strong>${this.helpRequests.length}</strong></p>
                    <button class="btn-primary" onclick="app.retryMapLoad()" style="margin-top: 1rem;">
                        Повторить загрузку карты
                    </button>
                </div>
            `;
        }
    }

    // Повторная загрузка карты
    retryMapLoad() {
        this.mapRetryCount = 0;
        console.log(`🔄 Повторная попытка загрузки карты`);
        this.initYandexMaps();
    }

    // Навигация между страницами
    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.target.dataset.page;
                console.log("Переход на страницу:", pageId);
                
                // Убираем активный класс у всех кнопок
                navButtons.forEach(b => b.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                e.target.classList.add('active');
                
                // Скрываем все страницы
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Показываем выбранную страницу
                document.getElementById(`${pageId}-page`).classList.add('active');
                
                // Загружаем данные если нужно
                if (pageId === 'funds') {
                    this.loadFunds();
                }
                
                // Инициализируем карту если перешли на страницу карты и она еще не загружена
                if (pageId === 'map' && !this.isMapLoaded) {
                    setTimeout(() => this.initYandexMaps(), 100);
                }
            });
        });
    }

    // Инициализация кнопок
    initButtons() {
        // Кнопка создания заявки
        const createRequestBtn = document.getElementById('create-request-btn');
        if (createRequestBtn) {
            createRequestBtn.addEventListener('click', () => {
                console.log("🎯 Кнопка 'Создать заявку' нажата!");
                this.showCreateRequestForm();
            });
        }

        // Кнопка добавления фонда
        const addFundBtn = document.getElementById('add-fund-btn');
        if (addFundBtn) {
            addFundBtn.addEventListener('click', () => {
                console.log("🎯 Кнопка 'Добавить фонд' нажата!");
                this.showAddFundForm();
            });
        }

        // Тестовая кнопка
        const testBtn = document.getElementById('test-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                console.log("🧪 Тестовая кнопка нажата!");
                this.testAPI();
            });
        }

        // Фильтры
        const categoryFilter = document.getElementById('category-filter');
        const urgencyFilter = document.getElementById('urgency-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.updateMapMarkers());
        }
        if (urgencyFilter) {
            urgencyFilter.addEventListener('change', () => this.updateMapMarkers());
        }
    }

    // Обновление меток на карте
    updateMapMarkers() {
        if (!this.map || !this.isMapLoaded) {
            console.log("❌ Карта не инициализирована, пропускаем обновление меток");
            return;
        }
        
        console.log("🔄 Обновление меток на карте...");
        console.log("Всего заявок:", this.helpRequests.length);
        
        // Очищаем старые метки
        this.placemarks.forEach(pm => this.map.geoObjects.remove(pm));
        this.placemarks = [];
        
        // Фильтруем заявки
        const categoryFilter = document.getElementById('category-filter');
        const urgencyFilter = document.getElementById('urgency-filter');
        
        const category = categoryFilter ? categoryFilter.value : '';
        const urgency = urgencyFilter ? urgencyFilter.value : '';
        
        const filteredRequests = this.helpRequests.filter(request => {
            return (!category || request.category === category) && 
                   (!urgency || request.urgency === urgency);
        });
        
        console.log("Отфильтровано заявок:", filteredRequests.length);
        
        // Создаем новые метки
        filteredRequests.forEach((request, index) => {
            console.log(`Создаем метку ${index + 1}:`, request.title, request.latitude, request.longitude);
            
            // Проверяем координаты
            if (!request.latitude || !request.longitude) {
                console.log("❌ У заявки нет координат:", request);
                return;
            }
            
            const categoryEmojis = {
                'food': '🍎',
                'clothes': '👕',
                'medicine': '💊'
            };
            
            const placemark = new ymaps.Placemark(
                [request.latitude, request.longitude],
                {
                    balloonContentHeader: `<strong>${categoryEmojis[request.category] || '📍'} ${request.title}</strong>`,
                    balloonContentBody: `
                        <div style="padding: 10px;">
                            <p><strong>Категория:</strong> ${this.getCategoryDisplay(request.category)}</p>
                            <p><strong>Срочность:</strong> ${this.getUrgencyDisplay(request.urgency)}</p>
                            <p><strong>Адрес:</strong> ${request.address}</p>
                            <p><strong>Описание:</strong> ${request.description}</p>
                            <p><strong>Контакт:</strong> ${request.contact_name}</p>
                            <p><strong>Телефон:</strong> <a href="tel:${request.contact_phone}">${request.contact_phone}</a></p>
                        </div>
                    `,
                    hintContent: request.title
                },
                {
                    preset: this.getPresetByUrgency(request.urgency),
                    balloonCloseButton: true,
                    hideIconOnBalloonOpen: false
                }
            );
            
            this.placemarks.push(placemark);
            this.map.geoObjects.add(placemark);
        });
        
        console.log("✅ Создано меток:", this.placemarks.length);
    }

    // Получение отображения категории
    getCategoryDisplay(category) {
        const categories = {
            'food': '🍎 Еда',
            'clothes': '👕 Одежда',
            'medicine': '💊 Лекарства'
        };
        return categories[category] || category;
    }

    // Получение отображения срочности
    getUrgencyDisplay(urgency) {
        const urgencies = {
            'low': '📗 Не срочно',
            'medium': '📘 Средняя',
            'high': '📙 Срочно',
            'critical': '📕 Очень срочно'
        };
        return urgencies[urgency] || urgency;
    }

    // Получение иконки по срочности
    getPresetByUrgency(urgency) {
        const presets = {
            'critical': 'islands#redIcon',
            'high': 'islands#orangeIcon', 
            'medium': 'islands#blueIcon',
            'low': 'islands#greenIcon'
        };
        return presets[urgency] || 'islands#blueIcon';
    }

    // Обновление статистики
    updateStats() {
        const requestsCount = document.getElementById('requests-count');
        if (requestsCount) {
            requestsCount.textContent = `Заявок: ${this.helpRequests.length}`;
        }
    }

    // Форма создания заявки (с координатами)
    showCreateRequestFormWithCoords(coords) {
        this.showCreateRequestForm(coords);
    }

    // Форма создания заявки
    showCreateRequestForm(coords = null) {
        const coordsInfo = coords ? 
            `<p style="color: #28a745; margin-bottom: 1rem;">📍 Координаты выбраны: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</p>` : 
            '<p style="color: #666; margin-bottom: 1rem;">💡 Совет: кликните на карте, чтобы выбрать место</p>';
        
        const formHtml = `
            <h3>✋ Создать заявку о помощи</h3>
            ${coordsInfo}
            <form onsubmit="app.submitHelpRequest(event, ${coords ? `[${coords[0]}, ${coords[1]}]` : 'null'})">
                <input type="text" name="title" placeholder="Заголовок заявки *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <textarea name="description" placeholder="Описание потребности *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; height: 100px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                
                <div style="display: flex; gap: 1rem; margin: 0.5rem 0;">
                    <select name="category" required style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Категория *</option>
                        <option value="food">🍎 Еда</option>
                        <option value="clothes">👕 Одежда</option>
                        <option value="medicine">💊 Лекарства</option>
                    </select>
                    
                    <select name="urgency" required style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Срочность *</option>
                        <option value="low">📗 Не срочно</option>
                        <option value="medium">📘 Средняя</option>
                        <option value="high">📙 Срочно</option>
                        <option value="critical">📕 Очень срочно</option>
                    </select>
                </div>
                
                <input type="text" name="address" placeholder="Адрес *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                
                <div style="display: flex; gap: 1rem; margin: 0.5rem 0;">
                    <input type="text" name="contact_name" placeholder="Ваше имя *" required style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    <input type="tel" name="contact_phone" placeholder="Телефон *" required style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="button" class="btn-secondary" onclick="app.hideModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Создать заявку</button>
                </div>
            </form>
        `;
        
        this.showModal('Создать заявку', formHtml);
    }

    // Отправка заявки
    async submitHelpRequest(event, coords = null) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Используем координаты с карты или генерируем случайные
        if (coords) {
            data.latitude = coords[0];
            data.longitude = coords[1];
        } else {
            // Для демо - случайные координаты в Москве
            data.latitude = 55.7558 + (Math.random() - 0.5) * 0.1;
            data.longitude = 37.6173 + (Math.random() - 0.5) * 0.1;
        }
        
        // Добавляем ID и timestamp
        data.id = Date.now();
        data.created_at = new Date().toISOString();
        
        try {
            // Сначала сохраняем локально
            await this.saveRequest(data);
            
            // Затем пытаемся отправить на сервер
            try {
                const response = await fetch(`${this.backendUrl}/help-requests/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    console.log('✅ Заявка отправлена на сервер');
                }
            } catch (serverError) {
                console.warn('⚠️ Сервер недоступен, заявка сохранена локально:', serverError);
            }
            
            this.showModal('Успех', '✅ Заявка успешно создана и сохранена!');
            setTimeout(() => this.hideModal(), 2000);
            
            // Перезагружаем заявки
            await this.loadSavedRequests();
            this.updateMapMarkers();
            this.updateStats();
            
        } catch (error) {
            console.error('Ошибка сохранения заявки:', error);
            this.showModal('Ошибка', '❌ Не удалось создать заявку: ' + error.message);
        }
    }

    // Сохранение заявки (без использования localStorage)
    async saveRequest(request) {
        console.log('💾 Сохраняем заявку:', request);
        
        // Добавляем в массив
        this.helpRequests.push(request);
        
        // Если есть бэкенд, сохраняем там
        // Если нет - заявка остается в памяти до перезагрузки страницы
        console.log('✅ Заявка добавлена в память');
    }

    // Загрузка сохраненных заявок
    async loadSavedRequests() {
        console.log('📥 Загружаем сохраненные заявки...');
        
        // Пробуем загрузить с сервера
        try {
            const response = await fetch(`${this.backendUrl}/help-requests/`);
            if (response.ok) {
                const data = await response.json();
                this.helpRequests = data.results || data;
                console.log(`✅ Загружено ${this.helpRequests.length} заявок с сервера`);
            }
        } catch (error) {
            console.warn('⚠️ Сервер недоступен, используем локальные данные');
            // Если сервер недоступен, начинаем с пустого массива
            this.helpRequests = [];
        }
        
        this.updateStats();
    }

    // Форма добавления фонда
    showAddFundForm() {
        const formHtml = `
            <h3>🏛️ Добавить благотворительный фонд</h3>
            <form onsubmit="app.submitFundForm(event)">
                <input type="text" name="name" placeholder="Название фонда *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <textarea name="description" placeholder="Описание фонда *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; height: 100px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                <input type="url" name="website" placeholder="Веб-сайт" style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <input type="email" name="contact_email" placeholder="Email" style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="button" class="btn-secondary" onclick="app.hideModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Добавить фонд</button>
                </div>
            </form>
        `;
        
        this.showModal('Добавить фонд', formHtml);
    }

    // Отправка формы фонда
    async submitFundForm(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.backendUrl}/funds/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.showModal('Успех', '✅ Фонд успешно добавлен!');
                setTimeout(() => this.hideModal(), 2000);
                // Перезагружаем фонды
                this.loadFunds();
            } else {
                throw new Error('Ошибка при добавлении фонда');
            }
        } catch (error) {
            this.showModal('Ошибка', '❌ Не удалось добавить фонд: ' + error.message);
        }
    }

    // Модальное окно
    initModal() {
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.getElementById('modal-close');

        this.modalClose.addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    showModal(title, content) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = content;
        this.modal.style.display = 'flex';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    // Загрузка фондов
    async loadFunds() {
        console.log("Загрузка фондов...");
        
        try {
            const response = await fetch(`${this.backendUrl}/funds/`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const funds = await response.json();
            console.log("Загружено фондов:", funds.length);
            
            this.displayFunds(funds);
            
        } catch (error) {
            console.error("Ошибка загрузки фондов:", error);
            this.showModal('Ошибка', 'Не удалось загрузить фонды. Проверьте подключение к серверу.');
        }
    }

    // Отображение фондов
    displayFunds(funds) {
        const fundsList = document.getElementById('funds-list');
        
        if (!fundsList) return;

        if (funds.length === 0) {
            fundsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Пока нет благотворительных фондов</p>';
            return;
        }

        fundsList.innerHTML = funds.map(fund => `
            <div class="fund-card">
                <h3>${fund.name}</h3>
                <p>${fund.description}</p>
                ${fund.website ? `<p><a href="${fund.website}" target="_blank" rel="noopener noreferrer">🌐 Сайт</a></p>` : ''}
                ${fund.contact_email ? `<p>📧 ${fund.contact_email}</p>` : ''}
                <button class="btn-primary" onclick="app.showModal('${fund.name}', 'Поддержка фонда в разработке')">
                    Поддержать
                </button>
            </div>
        `).join('');
    }

    // Тест API
    async testAPI() {
        console.log('🧪 Тестируем систему...');
        
        let apiStatus = '❌ Недоступен';
        let fundsCount = 0;
        
        try {
            const response = await fetch(`${this.backendUrl}/funds/`);
            if (response.ok) {
                const data = await response.json();
                apiStatus = '✅ Работает';
                fundsCount = data.length;
            }
        } catch (error) {
            console.error('API недоступен:', error);
        }
        
        const ymapsStatus = typeof ymaps !== 'undefined' ? '✅ Загружен' : '❌ Не загружен';
        
        this.showModal('🧪 Тест системы', `
            <div style="text-align: left;">
                <p><strong>API Backend:</strong> ${apiStatus}</p>
                <p><strong>Яндекс.Карты:</strong> ${ymapsStatus}</p>
                <p><strong>Карта инициализирована:</strong> ${this.isMapLoaded ? '✅ Да' : '❌ Нет'}</p>
                <p><strong>Заявок в памяти:</strong> ${this.helpRequests.length}</p>
                <p><strong>Меток на карте:</strong> ${this.placemarks.length}</p>
                <p><strong>Фондов на сервере:</strong> ${fundsCount}</p>
            </div>
        `);
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM загружен, запускаем приложение!");
    window.app = new CharityApp();
});