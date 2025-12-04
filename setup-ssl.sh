#!/bin/bash

# Скрипт для установки SSL сертификата (Let's Encrypt)

echo "🔒 Установка SSL сертификата для vsvmeste.ru"

# Установка certbot
echo "📦 Устанавливаем certbot..."
sudo apt update
sudo apt install -y certbot

# Остановка nginx контейнера для получения сертификата
echo "⏸️  Временно останавливаем nginx..."
docker-compose stop nginx

# Получение сертификата
echo "📜 Получаем SSL сертификат..."
sudo certbot certonly --standalone \
  -d vsvmeste.ru \
  -d www.vsvmeste.ru \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

if [ $? -eq 0 ]; then
    echo "✅ Сертификат успешно получен!"
    
    # Обновляем docker-compose.yml для монтирования сертификатов
    echo "📝 Обновите docker-compose.yml:"
    echo "   Добавьте в секцию nginx volumes:"
    echo "     - /etc/letsencrypt:/etc/letsencrypt:ro"
    echo ""
    echo "📝 Раскомментируйте HTTPS секцию в nginx.conf"
    echo ""
    echo "🔄 Перезапустите контейнеры: docker-compose up -d"
    
    # Настройка автообновления
    echo "⚙️  Настраиваем автообновление сертификата..."
    echo "0 3 * * * root certbot renew --quiet && docker-compose restart nginx" | sudo tee -a /etc/crontab
    
else
    echo "❌ Ошибка при получении сертификата"
    echo "Проверьте:"
    echo "  1. Домен vsvmeste.ru указывает на этот сервер"
    echo "  2. Порты 80 и 443 открыты в firewall"
    echo "  3. Nginx остановлен (порт 80 свободен)"
fi

# Запускаем nginx обратно
docker-compose start nginx
