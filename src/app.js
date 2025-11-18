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
        const formHtml = `
            <h3>✋ Создать заявку о помощи</h3>
            <form onsubmit="app.submitHelpRequest(event)" id="requestForm">
                <input type="text" name="title" placeholder="Заголовок заявки *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem;">
                <textarea name="description" placeholder="Описание потребности *" required style="width: 100%; margin: 0.5rem 0; padding: 0.5rem; height: 100px;"></textarea>
                
                <div style="display: flex; gap: 1rem; margin: 0.5rem 0;">
                    <select name="category" required style="flex: 1; padding: 0.5rem;">
                        <option value="">Категория *</option>
                        <option value="food">🍎 Еда</option>
                        <option value="clothes">👕 Одежда</option>
                        <option value="medicine">💊 Лекарства</option>
                        <option value="household">🏠 Хозтовары</option>
                        <option value="other">❔ Другое</option>
                    </select>
                    
                    <select name="urgency" required style="flex: 1; padding: 0.5rem;">
                        <option value="">Срочность *</option>
                        <option value="low">📗 Не срочно</option>
                        <option value="medium">📐 Средняя</option>
                        <option value="high">📙 Срочно</option>
                        <option value="critical">📕 Очень срочно</option>
                    </select>
                </div>
                
                <!-- АДРЕС С РАБОЧИМ YANDEX SUGGEST -->
                <div style="margin: 0.5rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">📍 Адрес *</label>
                    <input type="text" 
                           id="address-input" 
                           placeholder="Введите адрес..." 
                           required 
                           style="width: 100%; padding: 0.8rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
                           autocomplete="off">
                    <input type="hidden" id="latitude" name="latitude" value="${coords ? coords[0] : ''}">
                    <input type="hidden" id="longitude" name="longitude" value="${coords ? coords[1] : ''}">
                    <input type="hidden" id="full-address" name="address">
                    <p style="font-size: 0.8rem; color: #666; margin: 0.5rem 0 0 0;">
                        Начните вводить адрес - появятся подсказки от Яндекс Карт
                    </p>
                </div>
                
                <div style="display: flex; gap: 1rem; margin: 0.5rem 0;">
                    <input type="text" name="contact_name" placeholder="Ваше имя *" required style="flex: 1; padding: 0.5rem;">
                    <input type="tel" name="contact_phone" placeholder="Телефон *" required style="flex: 1; padding: 0.5rem;">
                </div>
                
                <input type="email" name="contact_email" placeholder="Email (необязательно)" style="width: 100%; margin: 0.5rem 0; padding: 0.5rem;">
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="button" class="btn-secondary" onclick="app.hideModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Создать заявку</button>
                </div>
            </form>
        `;
        
        this.showModal('Создать заявку', formHtml);
        
        // Инициализируем Яндекс Suggest
        setTimeout(() => this.initYandexSuggest(), 100);
    }

    // Инициализация Яндекс Suggest
    initYandexSuggest() {
        const addressInput = document.getElementById('address-input');
        
        if (!addressInput) {
            console.log("❌ Поле адреса не найдено");
            return;
        }
        
        // Проверяем что Яндекс API загрузилось
        if (typeof ymaps === 'undefined') {
            console.log("❌ Яндекс API не загрузилось");
            this.showSimpleAutocomplete(); // Fallback
            return;
        }
        
        console.log("✅ Яндекс API загружено, инициализируем Suggest");
        
        // Ждем полной загрузки Яндекс
        ymaps.ready(() => {
            try {
                // Создаем SuggestView
                const suggestView = new ymaps.SuggestView('address-input', {
                    results: 5,
                    width: '100%'
                });
                
                // Обрабатываем выбор подсказки
                suggestView.events.add('select', (e) => {
                    const selectedAddress = e.get('item').value;
                    console.log("📍 Выбран адрес:", selectedAddress);
                    
                    // Устанавливаем выбранный адрес
                    addressInput.value = selectedAddress;
                    
                    // Геокодируем для получения координат
                    this.geocodeAddress(selectedAddress);
                });
                
                console.log("✅ Яндекс Suggest инициализирован");
                
            } catch (error) {
                console.error("❌ Ошибка инициализации Suggest:", error);
                this.showSimpleAutocomplete(); // Fallback
            }
        });
    }

    // Геокодирование адреса
    geocodeAddress(address) {
        if (typeof ymaps === 'undefined') return;
        
        console.log("🗺️ Геокодируем адрес:", address);
        
        ymaps.geocode(address)
            .then((res) => {
                const firstGeoObject = res.geoObjects.get(0);
                
                if (firstGeoObject) {
                    const coords = firstGeoObject.geometry.getCoordinates();
                    const fullAddress = firstGeoObject.getAddressLine();
                    
                    console.log("✅ Координаты найдены:", coords);
                    console.log("✅ Полный адрес:", fullAddress);
                    
                    // Сохраняем данные
                    document.getElementById('full-address').value = fullAddress;
                    document.getElementById('latitude').value = coords[0];
                    document.getElementById('longitude').value = coords[1];
                    
                    // Показываем подтверждение
                    this.showAddressConfirmation(fullAddress);
                    
                } else {
                    console.log("❌ Адрес не найден");
                    this.useFallbackCoords(address);
                }
            })
            .catch((error) => {
                console.error("❌ Ошибка геокодирования:", error);
                this.useFallbackCoords(address);
            });
    }

    // Показываем подтверждение адреса
    showAddressConfirmation(address) {
        const addressInput = document.getElementById('address-input');
        
        // Подсвечиваем поле
        addressInput.style.borderColor = '#27ae60';
        addressInput.style.background = '#f8fff9';
        
        // Показываем сообщение
        let confirmation = document.getElementById('address-confirmation');
        if (!confirmation) {
            confirmation = document.createElement('div');
            confirmation.id = 'address-confirmation';
            confirmation.style.cssText = 'background: #d4edda; color: #155724; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.9rem;';
            addressInput.parentNode.appendChild(confirmation);
        }
        
        confirmation.innerHTML = `✅ Адрес подтвержден: ${address}`;
    }

    // Fallback - случайные координаты
    useFallbackCoords(address) {
        console.log("📍 Используем резервные координаты для:", address);
        
        document.getElementById('full-address').value = address;
        
        // Случайные координаты в центре России
        const coords = [
            55.7558 + (Math.random() - 0.5) * 10,
            37.6173 + (Math.random() - 0.5) * 20
        ];
        
        document.getElementById('latitude').value = coords[0];
        document.getElementById('longitude').value = coords[1];
        
        console.log("📍 Резервные координаты:", coords);
    }

    // Простой fallback автокомплит
    showSimpleAutocomplete() {
        console.log("🔄 Используем простой автокомплит");
        
        const addressInput = document.getElementById('address-input');
        if (!addressInput) return;
        
        // Простые подсказки
        addressInput.setAttribute('list', 'simple-addresses');
        
        const datalist = document.createElement('datalist');
        datalist.id = 'simple-addresses';
        datalist.innerHTML = `
            <option value="Москва, Красная площадь">
            <option value="Москва, ул. Тверская">
            <option value="Москва, Арбат">
            <option value="Санкт-Петербург, Невский проспект">
            <option value="Санкт-Петербург, Дворцовая площадь">
            <option value="Новосибирск, ул. Ленина">
            <option value="Екатеринбург, пр. Ленина">
            <option value="Казань, ул. Баумана">
        `;
        
        addressInput.parentNode.appendChild(datalist);
    }

    // Отправка заявки
    async submitHelpRequest(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        console.log("📤 Отправляем заявку с адресом:", data.address);
        console.log("📍 Координаты:", data.latitude, data.longitude);
        
        try {
            const response = await fetch(`${this.backendUrl}/help-requests/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.showModal('Успех', '✅ Заявка успешно создана!');
                this.hideModal();
                setTimeout(() => this.loadHelpRequests(), 1000);
            } else {
                throw new Error('Ошибка при создании заявки');
            }
        } catch (error) {
            console.error("❌ Ошибка:", error);
            this.showModal('Ошибка', '❌ Не удалось создать заявку');
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
                this.hideModal();
                this.loadFunds();
            } else {
                throw new Error('Ошибка при добавлении фонда');
            }
        } catch (error) {
            console.error("❌ Ошибка:", error);
            this.showModal('Ошибка', '❌ Не удалось добавить фонд');
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

    // Загрузка заявок
    async loadHelpRequests() {
        console.log('📥 Загружаем заявки...');
        await this.loadSavedRequests();
        this.updateMapMarkers();
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM загружен, запускаем приложение!");
    window.app = new CharityApp();
});