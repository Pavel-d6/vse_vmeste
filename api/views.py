from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import CharityFund, HelpRequest, CustomUser
from .serializers import (
    CharityFundSerializer, HelpRequestSerializer,
    UserRegistrationSerializer, UserProfileSerializer
)
# СУЩЕСТВУЮЩИЙ КОД - оставляем как есть
class CharityFundViewSet(viewsets.ModelViewSet):
    queryset = CharityFund.objects.filter(is_active=True)
    serializer_class = CharityFundSerializer
    permission_classes = [permissions.AllowAny]

class HelpRequestViewSet(viewsets.ModelViewSet):
    queryset = HelpRequest.objects.filter(is_active=True, is_fulfilled=False)
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)  # км
        
        if not lat or not lng:
            return Response({'error': 'Требуются параметры lat и lng'}, status=400)
        
        try:
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
            
            # Простая фильтрация по квадрату (для демо)
            lat_range = 0.09 * radius
            lng_range = 0.14 * radius
            
            nearby_requests = HelpRequest.objects.filter(
                latitude__range=(lat - lat_range, lat + lat_range),
                longitude__range=(lng - lng_range, lng + lng_range),
                is_active=True,
                is_fulfilled=False
            )
            
            serializer = self.get_serializer(nearby_requests, many=True)
            return Response(serializer.data)
            
        except ValueError:
            return Response({'error': 'Неверные координаты'}, status=400)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_overview(request):
    api_urls = {
        'message': 'Добро пожаловать в API карты взаимопомощи!',
        'endpoints': {
            'funds': '/api/funds/',
            'help-requests': '/api/help-requests/',
            'nearby-requests': '/api/help-requests/nearby/?lat=55.75&lng=37.61&radius=10',
            'register': '/api/auth/register/',
            'login': '/api/auth/login/',
            'profile': '/api/auth/profile/',
            'my-requests': '/api/my-requests/',
            'create-request': '/api/requests/create/',
            'admin': '/admin/',
        }
    }
    return Response(api_urls)

# НОВЫЙ КОД - авторизация

# Регистрация пользователя
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print("📥 Данные регистрации:", request.data)
        print("📥 Заголовки:", request.headers)
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print("❌ Ошибка создания пользователя:", e)
            import traceback
            traceback.print_exc()
            raise

# Логин пользователя
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def test_register(request):
    """Тестовый endpoint для регистрации"""
    print("📥 Получены данные:", request.data)
    
    # Простая проверка
    required_fields = ['username', 'email', 'password', 'password2']
    for field in required_fields:
        if field not in request.data:
            return Response(
                {'error': f'Отсутствует поле: {field}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Проверка паролей
    if request.data['password'] != request.data['password2']:
        return Response(
            {'error': 'Пароли не совпадают'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({'success': 'Данные валидны'}, status=status.HTTP_200_OK)

# Профиль пользователя
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# Заявки пользователя
class UserHelpRequestsView(generics.ListAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HelpRequest.objects.filter(user=self.request.user).order_by('-created_at')

# Создание заявки (только для авторизованных)
class HelpRequestCreateView(generics.CreateAPIView):
    serializer_class = HelpRequestSerializer  # Используем существующий
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
# Логин пользователя
class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response(
                {'error': 'Неверные учетные данные'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )