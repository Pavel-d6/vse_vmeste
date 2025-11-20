from rest_framework import serializers
from .models import CharityFund, HelpRequest, CustomUser
from django.contrib.auth.password_validation import validate_password

# СУЩЕСТВУЮЩИЙ КОД - оставляем как есть
class CharityFundSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CharityFund
        fields = ['id', 'name', 'description', 'image', 'image_url', 'website', 
                 'contact_email', 'is_active', 'created_at']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

# СУЩЕСТВУЮЩИЙ КОД - оставляем как есть
class HelpRequestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_display', read_only=True)
    
    class Meta:
        model = HelpRequest
        fields = ['id', 'title', 'description', 'category', 'category_display', 
                 'urgency', 'urgency_display', 'address', 'latitude', 'longitude',
                 'contact_name', 'contact_phone', 'contact_email', 
                 'is_active', 'is_fulfilled', 'created_at', 'user']  # ДОБАВИЛИ 'user'

# НОВЫЙ КОД - добавляем сериализаторы для авторизации
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2')
        # Убрали phone, first_name, last_name - они optional

    def validate(self, attrs):
        print("🔍 Валидация данных:", attrs)
        
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        # Проверяем уникальность username
        if CustomUser.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Пользователь с таким именем уже существует"})
            
        # Проверяем уникальность email
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
            
        return attrs

    def create(self, validated_data):
        print("🔍 Создание пользователя:", validated_data)
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        print("✅ Пользователь создан:", user.username)
        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'phone', 'first_name', 'last_name', 'avatar', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

# НОВЫЙ сериализатор для создания заявок (с пользователем)
class HelpRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpRequest
        fields = ['title', 'description', 'category', 'urgency', 'address', 
                 'latitude', 'longitude', 'contact_name', 'contact_phone', 'contact_email']