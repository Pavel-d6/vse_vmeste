from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Админка Django
    path('admin/', admin.site.urls),
    
    # API приложения
    path('api/', include('api.urls')),  # ← ВКЛЮЧАЕМ ваши API пути
    
    # ========== ФРОНТЕНД ==========
    # Главная страница - отдаём index.html
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Для SPA - все остальные пути тоже отдают index.html
    # (кроме API, админки и статики)
    re_path(r'^(?!api/|admin/|static/|media/).*$', 
            TemplateView.as_view(template_name='index.html')),
]

# Для отдачи статики в разработке
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)