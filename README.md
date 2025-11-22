# Charity platform
## Короткое описание
Приложение позволяет отправить фотографию и адрес незаконного граффити. После обработки заявки модерацией, в администрацию района будет отправлена заявка на удаление. Статус своей заявки можно отслеживать.

---
# local Start

 Terminal 1, Backend
source venv/bin/activate
python manage.py runserver

 Terminal 2, Frontend
cd src
python3 -m http.server 3000

---
# Функционал сайта
- Авторизация / регистрация фонда, физ. лица
- Возможность оставить заявку на интерактивной карте для физ. лица
- Актуальная информация о фондах, зарегистрированных на сайте

---
# Стек
- Python, Django, Django frameworks
- YandexMapAPI
- HTML, CSS, JS
- SQLite3

---
# Структура проекта
<pre>
    .
    ├── vse_vmeste
    │   ├── api/                              # Реализатор API
    │       ├── pycache/                  
    │       ├── migrations/   
    │       ├── admin.py       
    │       ├── apps.py
    │       ├── models.py
    │       ├── serializers.py
    │       ├── tests.py
    │       ├── urls.py
    │       ├── views.py 
    │   ├── charity_platform/  
    │       ├── pycache/
    │       ├── asgi.py 
    │       ├── settings.py       
    │       ├── urls.py      
    │       ├── wsgi.py       
    │   ├── src/                               # Папка с кодом
    │       ├── images/                        # Папка с картинками(пока только логотип)
    |           ├── favicon.png                # Логотип      
    │       ├── .DS_Store
    │       ├── api.js
    │       ├── app.js
    │       ├── auth.js
    │       ├── index.html
    │       ├── map.js
    │       ├── styles.css
    │       ├── ui.js
    │   ├── venv/                              # Виртуальное окружение
    |   ├── README.md                          # Документация
    |   ├── manage.py                          # Запуск сервера на Django
    |   ├── requirements.txt  
    |   ├── start_server.sh                    # Запуск сервера
</pre>