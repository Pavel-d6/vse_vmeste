#!/bin/bash

# Ждем пока PostgreSQL будет готов
echo "Ожидание PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL запущен"

# Применяем миграции
echo "Применение миграций..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Собираем статику
echo "Сбор статики..."
python manage.py collectstatic --noinput

# Создаем суперпользователя если его нет
echo "Проверка суперпользователя..."
python manage.py shell << END
from api.models import CustomUser
if not CustomUser.objects.filter(username='admin').exists():
    CustomUser.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Суперпользователь создан: admin / admin123')
else:
    print('Суперпользователь уже существует')
END

# Запускаем Gunicorn
echo "Запуск Gunicorn..."
exec gunicorn charity_platform.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -