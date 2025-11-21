// map.js - Яндекс.Карты
class MapManager {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.isMapLoaded = false;
        this.activeFilters = {
            category: '',
            urgency: ''
        };
        this.allPlacemarks = []; // Храним все метки для фильтрации
    }

    initYandexMaps() {
        console.log("🗺️ Инициализируем карту...");
        
        if (typeof ymaps !== 'undefined') {
            this.initMap();
            return;
        }

        const checkInterval = setInterval(() => {
            if (typeof ymaps !== 'undefined') {
                clearInterval(checkInterval);
                this.initMap();
            }
        }, 100);
    }

    initMap() {
        if (typeof ymaps === 'undefined') {
            console.error("❌ Яндекс.Карты не доступны");
            return;
        }

        ymaps.ready(() => {
            try {
                const mapElement = document.getElementById('map');
                if (!mapElement) return;

                mapElement.innerHTML = '';
                
                this.map = new ymaps.Map('map', {
                    center: [55.7558, 37.6173],
                    zoom: 10,
                    controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
                });

                this.isMapLoaded = true;
                console.log("✅ Карта создана");

                // Инициализируем фильтры после создания карты
                this.initFilters();
                // Обновляем метки после загрузки карты
                this.updateMapMarkers();

            } catch (error) {
                console.error("❌ Ошибка создания карты:", error);
            }
        });
    }

    // Инициализация обработчиков фильтров
    initFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const urgencyFilter = document.getElementById('urgency-filter');

        if (categoryFilter && urgencyFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.activeFilters.category = e.target.value;
                this.applyFilters();
            });

            urgencyFilter.addEventListener('change', (e) => {
                this.activeFilters.urgency = e.target.value;
                this.applyFilters();
            });

            console.log("✅ Фильтры инициализированы");
        } else {
            console.log("❌ Элементы фильтров не найдены");
        }
    }

    // Применение фильтров к меткам
    applyFilters() {
        if (!this.map || !this.isMapLoaded) return;

        console.log("🔍 Применяем фильтры:", this.activeFilters);

        let visibleMarkersCount = 0;

        this.allPlacemarks.forEach(placemark => {
            const properties = placemark.properties;
            const category = properties.get('category');
            const urgency = properties.get('urgency');
            
            let showObject = true;
            
            // Проверяем фильтр категории
            if (this.activeFilters.category && category !== this.activeFilters.category) {
                showObject = false;
            }
            
            // Проверяем фильтр срочности
            if (this.activeFilters.urgency && urgency !== this.activeFilters.urgency) {
                showObject = false;
            }
            
            // Показываем или скрываем метку
            placemark.options.set('visible', showObject);
            
            if (showObject) {
                visibleMarkersCount++;
            }
        });

        console.log(`✅ Видимых меток: ${visibleMarkersCount}`);

        // Обновляем видимые границы карты
        this.updateMapBounds();
    }

    // Обновление границ карты для видимых меток
    updateMapBounds() {
        const visiblePlacemarks = this.allPlacemarks.filter(placemark => 
            placemark.options.get('visible')
        );

        if (visiblePlacemarks.length > 0) {
            const collection = new ymaps.GeoObjectCollection();
            visiblePlacemarks.forEach(placemark => collection.add(placemark));
            
            this.map.setBounds(collection.getBounds(), {
                checkZoomRange: true,
                zoomMargin: 50
            });
        }
    }

    updateMapMarkers(filteredRequests = null) {
        if (!this.map || !this.isMapLoaded) {
            console.log("❌ Карта не готова для меток");
            return;
        }
        
        console.log("🔄 Обновляем метки...");
        
        // Очищаем старые метки
        this.map.geoObjects.removeAll();
        this.allPlacemarks = [];
        
        const requests = filteredRequests || this.app.helpRequests;
        let addedMarkers = 0;
        
        // Добавляем новые метки
        requests.forEach((request) => {
            if (!request.latitude || !request.longitude) {
                console.log(`❌ Нет координат: ${request.title}`);
                return;
            }

            const categoryDisplay = this.getCategoryDisplay(request.category);
            const urgencyDisplay = this.getUrgencyDisplay(request.urgency);

            const placemark = new ymaps.Placemark(
                [request.latitude, request.longitude],
                {
                    balloonContentHeader: `<strong>${request.title}</strong>`,
                    balloonContentBody: `
                        <div style="padding: 10px; max-width: 300px;">
                            <p style="margin: 5px 0;"><strong>Категория:</strong> ${categoryDisplay}</p>
                            <p style="margin: 5px 0;"><strong>Срочность:</strong> ${urgencyDisplay}</p>
                            <p style="margin: 5px 0;"><strong>Адрес:</strong> ${request.address}</p>
                            <p style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">${request.description}</p>
                            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
                                <p style="margin: 5px 0;"><strong>Контакт:</strong> ${request.contact_name}</p>
                                <p style="margin: 5px 0;"><strong>Телефон:</strong> <a href="tel:${request.contact_phone}">${request.contact_phone}</a></p>
                                ${request.contact_email ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${request.contact_email}">${request.contact_email}</a></p>` : ''}
                            </div>
                        </div>
                    `,
                    hintContent: request.title,
                    // Добавляем свойства для фильтрации
                    category: request.category,
                    urgency: request.urgency
                },
                {
                    preset: this.getPresetByUrgency(request.urgency),
                    balloonCloseButton: true,
                    hideIconOnBalloonOpen: false,
                    visible: true // По умолчанию все метки видны
                }
            );
            
            this.map.geoObjects.add(placemark);
            this.allPlacemarks.push(placemark);
            addedMarkers++;
        });
        
        console.log(`✅ Добавлено меток: ${addedMarkers}`);
        
        // Применяем текущие фильтры после добавления меток
        this.applyFilters();
    }

    // Сброс фильтров (можно вызвать извне)
    resetFilters() {
        this.activeFilters.category = '';
        this.activeFilters.urgency = '';
        
        const categoryFilter = document.getElementById('category-filter');
        const urgencyFilter = document.getElementById('urgency-filter');
        
        if (categoryFilter) categoryFilter.value = '';
        if (urgencyFilter) urgencyFilter.value = '';
        
        this.applyFilters();
    }

    // Получение текущих активных фильтров
    getActiveFilters() {
        return { ...this.activeFilters };
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

    getPresetByUrgency(urgency) {
        const presets = {
            'critical': 'islands#redIcon',
            'high': 'islands#orangeIcon', 
            'medium': 'islands#blueIcon',
            'low': 'islands#greenIcon'
        };
        return presets[urgency] || 'islands#blueIcon';
    }
}