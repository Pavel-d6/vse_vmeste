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
        this.map.geoObjects.removeAll();

        const requests = filteredRequests || this.app.helpRequests;
        console.log(`📍 Обрабатываем ${requests.length} заявок`);
        
        // Группируем заявки по координатам
        const groupedRequests = {};
        requests.forEach((request) => {
            if (!request.latitude || !request.longitude) {
                console.log(`❌ Нет координат: ${request.title}`);
                return;
            }

            // Создаем ключ координат (округляем до 4 знаков)
            const coordKey = `${request.latitude.toFixed(4)}_${request.longitude.toFixed(4)}`;
            
            if (!groupedRequests[coordKey]) {
                groupedRequests[coordKey] = [];
            }
            
            groupedRequests[coordKey].push(request);
        });
        
        console.log(`🗂️ Создано ${Object.keys(groupedRequests).length} групп меток`);
        
        let addedMarkers = 0;
        
        // Создаем метки для каждой группы
        Object.values(groupedRequests).forEach((requestGroup) => {
            const firstRequest = requestGroup[0];
            const coords = [firstRequest.latitude, firstRequest.longitude];
            
            // Определяем цвет метки по максимальной срочности в группе
            const maxUrgency = this.getMaxUrgency(requestGroup.map(r => r.urgency));
            
            // Создаем содержимое балуна
            let balloonContent = '';
            
            if (requestGroup.length === 1) {
                // Одна заявка - обычный балун
                const req = requestGroup[0];
                balloonContent = this.createSingleRequestBalloon(req);
            } else {
                // Несколько заявок - список
                balloonContent = this.createMultipleRequestsBalloon(requestGroup);
            }
            
            const placemark = new ymaps.Placemark(
                coords,
                {
                    balloonContentHeader: requestGroup.length === 1 
                        ? `<strong>${firstRequest.title}</strong>`
                        : `<strong>📍 ${requestGroup.length} заявок на этом адресе</strong>`,
                    balloonContentBody: balloonContent,
                    hintContent: requestGroup.length === 1 
                        ? firstRequest.title
                        : `${requestGroup.length} заявок: ${firstRequest.address}`
                },
                {
                    preset: this.getPresetByUrgency(maxUrgency),
                    balloonCloseButton: true,
                    hideIconOnBalloonOpen: false
                }
            );

            this.map.geoObjects.add(placemark);
            addedMarkers++;
        });

        console.log(`✅ Добавлено меток: ${addedMarkers}`);

        
        // Автоматически подстраиваем масштаб
        if (addedMarkers > 0 && this.map.geoObjects.getBounds()) {
            this.map.setBounds(this.map.geoObjects.getBounds(), {
                checkZoomRange: true,
                zoomMargin: 50
            });
        }
    }

    createSingleRequestBalloon(req) {
        const categoryDisplay = this.getCategoryDisplay(req.category);
        const urgencyDisplay = this.getUrgencyDisplay(req.urgency);
        
        return `
            <div style="padding: 10px; max-width: 300px;">
                <p style="margin: 5px 0;"><strong>Категория:</strong> ${categoryDisplay}</p>
                <p style="margin: 5px 0;"><strong>Срочность:</strong> ${urgencyDisplay}</p>
                <p style="margin: 5px 0;"><strong>Адрес:</strong> ${req.address}</p>
                <p style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">${req.description}</p>
                <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
                    <p style="margin: 5px 0;"><strong>Контакт:</strong> ${req.contact_name}</p>
                    <p style="margin: 5px 0;"><strong>Телефон:</strong> <a href="tel:${req.contact_phone}">${req.contact_phone}</a></p>
                    ${req.contact_email ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${req.contact_email}">${req.contact_email}</a></p>` : ''}
                </div>
            </div>
        `;
    }

    createMultipleRequestsBalloon(requests) {
        let html = `<div style="padding: 10px; max-width: 350px; max-height: 400px; overflow-y: auto;">`;
        html += `<p style="margin-bottom: 10px; color: #666;">Адрес: ${requests[0].address}</p>`;
        
        requests.forEach((req, index) => {
            const categoryDisplay = this.getCategoryDisplay(req.category);
            const urgencyDisplay = this.getUrgencyDisplay(req.urgency);
            
            html += `
                <div style="border: 2px solid #e9ecef; border-radius: 8px; padding: 10px; margin-bottom: 10px; background: white;">
                    <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${index + 1}. ${req.title}</h4>
                    <p style="margin: 3px 0; font-size: 0.9em;"><strong>Категория:</strong> ${categoryDisplay}</p>
                    <p style="margin: 3px 0; font-size: 0.9em;"><strong>Срочность:</strong> ${urgencyDisplay}</p>
                    <p style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.9em;">${req.description}</p>
                    <div style="border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; font-size: 0.9em;">
                        <p style="margin: 3px 0;"><strong>Контакт:</strong> ${req.contact_name}</p>
                        <p style="margin: 3px 0;"><strong>Телефон:</strong> <a href="tel:${req.contact_phone}">${req.contact_phone}</a></p>
                        ${req.contact_email ? `<p style="margin: 3px 0;"><strong>Email:</strong> <a href="mailto:${req.contact_email}">${req.contact_email}</a></p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
    }

    getMaxUrgency(urgencies) {
        const urgencyPriority = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        
        let maxPriority = 0;
        let maxUrgency = 'low';
        
        urgencies.forEach(urgency => {
            const priority = urgencyPriority[urgency] || 0;
            if (priority > maxPriority) {
                maxPriority = priority;
                maxUrgency = urgency;
            }
        });
        
        return maxUrgency;
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
