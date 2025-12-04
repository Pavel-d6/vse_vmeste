// Сначала убедимся, что Яндекс.Карты загружены
if (typeof ymaps === 'undefined') {
    // Загружаем Яндекс.Карты
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=1b67a21-0ce5-4416-857a-838e9778a629&lang=ru_RU';
    document.head.appendChild(script);
    
    // Ждем загрузки
    await new Promise(resolve => script.onload = resolve);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Даем время на инициализацию
}

const addresses = ['Верхняя Радищевская ул., 22, Москва', 'Ордынский тупик, 4, Москва', 'ш. Энтузиастов, 12, корп. 2, Москва', 'Садовая-Спасская ул., 21/1, Москва', 'Верхняя Красносельская ул., 38/19с1, Москва', 'ул. Шаболовка, 40, Москва', 'Люсиновская ул., 60, Москва', 'Новорогожская ул., 6, стр. 1, Москва', 'Большой Козловский пер., 11, стр. 1, Москва', ' ул. Покровка, 35/17с1, Москва', ' Солдатская ул., 8, корп. 1, Москва', ' Олимпийский просп., 30, стр. 1, Москва', ' Малый Палашёвский пер., 6, Москва', ' ул. Трофимова, 13, Москва', ' ул. Цандера, 8, Москва', ' Большой Кисловский пер., 4, стр. 1, Москва', ' ул. Большая Полянка, 28, корп. 1, Москва', ' Большой Факельный пер., 3, стр. 2, Москва', ' Садовая-Триумфальная ул., 22/31, Москва'];
let output = "";

// Используем прямое геокодирование через Яндекс.Карты
for (let addr of addresses) {
    try {
        const result = await ymaps.geocode(addr);
        const firstGeoObject = result.geoObjects.get(0);
        
        if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates();
            output += `${coords[0]} ${coords[1]}\n`;
            console.log(`✅ ${addr} -> ${coords[0]} ${coords[1]}`);
        } else {
            output += `0 0\n`;
            console.log(`❌ Адрес не найден: ${addr}`);
        }
    } catch (error) {
        output += `0 0\n`;
        console.log(`💥 Ошибка: ${addr}`, error);
    }
    
    await new Promise(r => setTimeout(r, 500)); // Задержка между запросами
}

// Создаем и скачиваем файл
const blob = new Blob([output], {type: 'text/plain'});
const a = document.createElement('a');