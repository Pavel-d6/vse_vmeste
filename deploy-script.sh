#!/bin/bash

# Скрипт для деплоя приложения на сервер

echo "🚀 Начинаем деплой vsvmeste.ru..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    echo "Установите Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен!${NC}"
    echo "Установите: sudo apt install docker-compose"
    exit 1
fi

# Проверка .env файла
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Файл .env не найден!${NC}"
    echo "Создайте .env файл на основе .env.example"
    exit 1
fi

echo -e "${GREEN}✅ Все зависимости на месте${NC}"

# Остановка старых контейнеров
echo -e "${YELLOW}📦 Останавливаем старые контейнеры...${NC}"
docker-compose down

# Сборка новых образов
echo -e "${YELLOW}🔨 Собираем Docker образы...${NC}"
docker-compose build

# Запуск контейнеров
echo -e "${YELLOW}🚀 Запускаем контейнеры...${NC}"
docker-compose up -d

# Ожидание запуска
sleep 5

# Проверка статуса
echo -e "${YELLOW}📊 Проверяем статус контейнеров...${NC}"
docker-compose ps

# Вывод логов
echo -e "${GREEN}📋 Последние логи:${NC}"
docker-compose logs --tail=50

echo ""
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "Сайт доступен по адресу: ${GREEN}http://vsvmeste.ru${NC}"
echo ""
echo "Полезные команды:"
echo "  docker-compose logs -f        # Смотреть логи"
echo "  docker-compose ps             # Статус контейнеров"
echo "  docker-compose restart        # Перезапустить"
echo "  docker-compose down           # Остановить"
