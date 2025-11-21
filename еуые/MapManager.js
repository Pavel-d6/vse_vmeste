// map.js - Яндекс.Карты
class MapManager {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.isMapLoaded = false;
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

                // Обновляем метки после загрузки карты
                this.updateMapMarkers();

            } catch (error) {
                console.error("❌ Ошибка создания карты:", error);
            }
        });
    }

    updateMapMarkers(filteredRequests = null) {
        if (!this.map || !this.isMapLoaded) {
            console.log("❌ Карта не готова для меток");
            return;
        }

        console.log("🔄 Обновляем метки...");

        // Очищаем старые метки
        this.map.geoObjects.removeAll();

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
                    hintContent: request.title
                },
                {
                    preset: this.getPresetByUrgency(request.urgency),
                    balloonCloseButton: true,
                    hideIconOnBalloonOpen: false
                }
            );

            this.map.geoObjects.add(placemark);
            addedMarkers++;
        });

        console.log(`✅ Добавлено меток: ${addedMarkers}`);

        // Автоматически подстраиваем масштаб карты под метки
        if (addedMarkers > 0) {
            this.map.setBounds(this.map.geoObjects.getBounds(), {
                checkZoomRange: true,
                zoomMargin: 50
            });
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
