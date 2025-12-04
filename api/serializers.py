from rest_framework import serializers
from .models import CharityFund, HelpRequest, CustomUser, Fundraiser
from django.contrib.auth.password_validation import validate_password

class CharityFundSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    
    class Meta:
        model = CharityFund
        fields = ['id', 'name', 'description', 'image', 'image_url', 'website', 
                 'contact_email', 'is_active', 'created_at', 'status', 
                 'creator', 'creator_username', 'rejection_reason']
        read_only_fields = ['creator', 'status']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class FundraiserSerializer(serializers.ModelSerializer):
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    progress_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Fundraiser
        fields = ['id', 'fund', 'fund_name', 'title', 'description', 
                 'goal_amount', 'current_amount', 'progress_percentage',
                 'image', 'image_url', 'status', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['current_amount', 'progress_percentage']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class HelpRequestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_display', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = HelpRequest
        fields = ['id', 'title', 'description', 'category', 'category_display', 
                 'urgency', 'urgency_display', 'address', 'latitude', 'longitude',
                 'contact_name', 'contact_phone', 'contact_email', 
                 'is_active', 'is_fulfilled', 'created_at', 'updated_at', 'user', 'username']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)
    account_type = serializers.CharField(write_only=True, required=False, default='user')

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'account_type')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        if CustomUser.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Пользователь с таким именем уже существует"})
            
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
        
        # Проверяем тип аккаунта
        account_type = attrs.get('account_type', 'user')
        if account_type not in ['user', 'fund']:
            raise serializers.ValidationError({"account_type": "Неверный тип аккаунта"})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        account_type = validated_data.pop('account_type', 'user')
        
        # Создаем пользователя
        user = CustomUser.objects.create_user(**validated_data)
        
        # Если регистрация аккаунта фонда - автоматически создаем заявку на фонд
        if account_type == 'fund':
            CharityFund.objects.create(
                name=f"Фонд {user.username}",
                description="Описание фонда (заполните позже)",
                contact_email=user.email,
                creator=user,
                status='pending'
            )
            print(f"✅ Создана заявка на фонд для пользователя {user.username}")
        
        return user
    

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'phone', 'first_name', 'last_name', 
                 'avatar', 'date_joined', 'role')
        read_only_fields = ('id', 'date_joined', 'role')


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class FundApprovalSerializer(serializers.ModelSerializer):
    """Для одобрения/отклонения фондов администратором"""
    class Meta:
        model = CharityFund
        fields = ['id', 'status', 'rejection_reason']