from django.db import models
from django.contrib.auth.models import AbstractUser

# ДОБАВЛЯЕМ В НАЧАЛО ФАЙЛА - модель пользователя
class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Аватар")
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
    
    def __str__(self):
        return self.username


# СУЩЕСТВУЮЩИЙ КОД - оставляем как есть
class CharityFund(models.Model):
    name = models.CharField(max_length=200, verbose_name="Название фонда")
    description = models.TextField(verbose_name="Описание")
    image = models.ImageField(upload_to='funds/', blank=True, null=True, verbose_name="Логотип")
    website = models.URLField(blank=True, verbose_name="Веб-сайт")
    contact_email = models.EmailField(blank=True, verbose_name="Контактный email")
    is_active = models.BooleanField(default=True, verbose_name="Активный")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    class Meta:
        verbose_name = "Благотворительный фонд"
        verbose_name_plural = "Благотворительные фонды"
    
    def __str__(self):
        return self.name


# ОБНОВЛЯЕМ существующую модель HelpRequest - ДОБАВЛЯЕМ поле user
class HelpRequest(models.Model):
    CATEGORY_CHOICES = [
        ('food', '🍎 Еда'),
        ('clothes', '👕 Одежда'), 
        ('medicine', '💊 Лекарства'),
        ('household', '🏠 Хозтовары'),
        ('other', '❔ Другое'),
    ]
    
    URGENCY_CHOICES = [
        ('low', '📗 Не срочно'),
        ('medium', '📐 Средняя срочность'), 
        ('high', '📙 Срочно'),
        ('critical', '📕 Очень срочно'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Заголовок")
    description = models.TextField(verbose_name="Описание потребности")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="Категория")
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='medium', verbose_name="Срочность")
    
    # Геоданные
    address = models.CharField(max_length=300, verbose_name="Адрес")
    latitude = models.FloatField(verbose_name="Широта") 
    longitude = models.FloatField(verbose_name="Долгота")
    
    # Контакты
    contact_name = models.CharField(max_length=100, verbose_name="Имя контактного лица")
    contact_phone = models.CharField(max_length=20, verbose_name="Телефон")
    contact_email = models.EmailField(blank=True, verbose_name="Email")
    
    # Статус
    is_active = models.BooleanField(default=True, verbose_name="Активная заявка")
    is_fulfilled = models.BooleanField(default=False, verbose_name="Выполнена")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    # ДОБАВЛЯЕМ ЭТО ПОЛЕ - связь с пользователем
    user = models.ForeignKey(
        CustomUser,  # Ссылаемся на нашу новую модель пользователя
        on_delete=models.CASCADE,
        related_name='help_requests',
        verbose_name="Пользователь",
        null=True,  # Временно для существующих заявок
        blank=True
    )
    
    class Meta:
        verbose_name = "Заявка на помощь"
        verbose_name_plural = "Заявки на помощь"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"