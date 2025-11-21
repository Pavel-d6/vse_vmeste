from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import CharityFund, HelpRequest, CustomUser, Fundraiser
from .serializers import (
    CharityFundSerializer, HelpRequestSerializer,
    UserRegistrationSerializer, UserProfileSerializer,
    FundraiserSerializer, FundApprovalSerializer
)

# Permissions
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsFundCreator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'fund_creator'

class IsFundOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.creator == request.user


# ViewSets
class CharityFundViewSet(viewsets.ModelViewSet):
    serializer_class = CharityFundSerializer
    
    def get_queryset(self):
        # Обычные пользователи видят только одобренные фонды
        if self.request.user.is_authenticated:
            if self.request.user.role == 'admin':
                return CharityFund.objects.all()
            elif self.request.user.role == 'fund_creator':
                # Создатели видят свои фонды + одобренные чужие
                return CharityFund.objects.filter(
                    Q(creator=self.request.user) | Q(status='approved')
                )
        return CharityFund.objects.filter(status='approved', is_active=True)
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsFundOwner()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Одобрить фонд"""
        fund = self.get_object()
        fund.status = 'approved'
        fund.save()
        
        print(f"✅ Фонд '{fund.name}' одобрен. Создатель: {fund.creator.username}, роль: {fund.creator.role}")
        
        return Response({'status': 'Фонд одобрен'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Отклонить фонд"""
        fund = self.get_object()
        fund.status = 'rejected'
        fund.rejection_reason = request.data.get('reason', '')
        fund.save()
        return Response({'status': 'Фонд отклонен'})


class HelpRequestViewSet(viewsets.ModelViewSet):
    queryset = HelpRequest.objects.filter(is_active=True, is_fulfilled=False)
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = HelpRequest.objects.filter(is_active=True, is_fulfilled=False)
        
        # Фильтрация
        category = self.request.query_params.get('category', None)
        urgency = self.request.query_params.get('urgency', None)
        
        if category:
            queryset = queryset.filter(category=category)
        if urgency:
            queryset = queryset.filter(urgency=urgency)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)
        
        if not lat or not lng:
            return Response({'error': 'Требуются параметры lat и lng'}, status=400)
        
        try:
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
            
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


class FundraiserViewSet(viewsets.ModelViewSet):
    serializer_class = FundraiserSerializer
    
    def get_queryset(self):
        # Фильтруем по фонду, если указан параметр
        fund_id = self.request.query_params.get('fund', None)
        if fund_id:
            return Fundraiser.objects.filter(fund_id=fund_id, status='active')
        return Fundraiser.objects.filter(status='active')
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsFundCreator()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Проверяем, что пользователь создатель этого фонда
        fund = serializer.validated_data['fund']
        if fund.creator != self.request.user:
            raise permissions.PermissionDenied("Вы не являетесь владельцем этого фонда")
        serializer.save()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_overview(request):
    api_urls = {
        'message': 'Добро пожаловать в API карты взаимопомощи!',
        'endpoints': {
            'funds': '/api/funds/',
            'help-requests': '/api/help-requests/',
            'fundraisers': '/api/fundraisers/',
            'register': '/api/auth/register/',
            'login': '/api/auth/login/',
            'profile': '/api/auth/profile/',
            'my-requests': '/api/my-requests/',
            'my-funds': '/api/my-funds/',
            'admin-pending-funds': '/api/admin/pending-funds/',
        }
    }
    return Response(api_urls)


# Auth views
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


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
                    'email': user.email,
                    'role': user.role
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response(
                {'error': 'Неверные учетные данные'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserHelpRequestsView(generics.ListAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HelpRequest.objects.filter(user=self.request.user).order_by('-created_at')


class HelpRequestCreateView(generics.CreateAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Admin views
class AdminPendingFundsView(generics.ListAPIView):
    """Список фондов на проверке для админа"""
    serializer_class = CharityFundSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return CharityFund.objects.filter(status='pending').order_by('-created_at')


class MyFundsView(generics.ListAPIView):
    """Мои фонды для создателя"""
    serializer_class = CharityFundSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CharityFund.objects.filter(creator=self.request.user).order_by('-created_at')


class MyFundraisersView(generics.ListAPIView):
    """Мои сборы для создателя фонда"""
    serializer_class = FundraiserSerializer
    permission_classes = [IsFundCreator]
    
    def get_queryset(self):
        # Возвращаем сборы всех фондов пользователя
        user_funds = CharityFund.objects.filter(creator=self.request.user)
        return Fundraiser.objects.filter(fund__in=user_funds).order_by('-created_at')