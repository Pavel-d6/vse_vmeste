from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CharityFund, HelpRequest, CustomUser

# НОВАЯ АДМИНКА ДЛЯ ПОЛЬЗОВАТЕЛЯ
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('phone', 'avatar')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {'fields': ('phone', 'avatar')}),
    )

# СУЩЕСТВУЮЩИЙ КОД - оставляем как есть
@admin.register(CharityFund)
class CharityFundAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['is_active']

# ОБНОВЛЯЕМ админку заявок - добавляем пользователя
@admin.register(HelpRequest)
class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'urgency', 'user', 'address', 'contact_name', 'is_active', 'is_fulfilled', 'created_at']  # ДОБАВИЛИ 'user'
    list_filter = ['category', 'urgency', 'is_active', 'is_fulfilled', 'created_at', 'user']  # ДОБАВИЛИ 'user'
    search_fields = ['title', 'description', 'address', 'contact_name', 'user__username']  # ДОБАВИЛИ поиск по пользователю
    list_editable = ['is_active', 'is_fulfilled']
    readonly_fields = ['created_at']