from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    USER_ROLES = [
        ('user', 'Обычный пользователь'),
        ('fund_creator', 'Создатель фонда'),
        ('admin', 'Администратор'),
    ]
    
    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Аватар")
    role = models.CharField(max_length=20, choices=USER_ROLES, default='user', verbose_name="Роль")
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
    
    def __str__(self):
        return self.username


class CharityFund(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На проверке'),
        ('approved', 'Одобрен'),
        ('rejected', 'Отклонен'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Название фонда")
    description = models.TextField(verbose_name="Описание")
    image = models.ImageField(upload_to='funds/', blank=True, null=True, verbose_name="Логотип")
    website = models.URLField(blank=True, verbose_name="Веб-сайт")
    contact_email = models.EmailField(blank=True, verbose_name="Контактный email")
    
    # Новые поля
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_funds', verbose_name="Создатель")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    rejection_reason = models.TextField(blank=True, verbose_name="Причина отклонения")
    
    is_active = models.BooleanField(default=True, verbose_name="Активный")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    class Meta:
        verbose_name = "Благотворительный фонд"
        verbose_name_plural = "Благотворительные фонды"
    
    def __str__(self):
        return self.name


class Fundraiser(models.Model):
    """Сбор средств от фонда"""
    STATUS_CHOICES = [
        ('active', 'Активный'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    ]
    
    fund = models.ForeignKey(CharityFund, on_delete=models.CASCADE, related_name='fundraisers', verbose_name="Фонд")
    title = models.CharField(max_length=200, verbose_name="Название сбора")
    description = models.TextField(verbose_name="Описание")
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цель сбора")
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Собрано")
    
    image = models.ImageField(upload_to='fundraisers/', blank=True, null=True, verbose_name="Изображение")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Статус")
    
    start_date = models.DateTimeField(verbose_name="Дата начала")
    end_date = models.DateTimeField(verbose_name="Дата окончания")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    class Meta:
        verbose_name = "Сбор средств"
        verbose_name_plural = "Сборы средств"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.fund.name})"
    
    @property
    def progress_percentage(self):
        if self.goal_amount > 0:
            return min(100, (float(self.current_amount) / float(self.goal_amount)) * 100)
        return 0


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
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='help_requests',
        verbose_name="Пользователь",
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "Заявка на помощь"
        verbose_name_plural = "Заявки на помощь"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"