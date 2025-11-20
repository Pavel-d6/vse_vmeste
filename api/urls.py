from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'funds', views.CharityFundViewSet)
router.register(r'help-requests', views.HelpRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('overview/', views.api_overview, name='api-overview'),
    
    # Аутентификация
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),  # ИСПРАВЛЕНО
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Заявки пользователя
    path('my-requests/', views.UserHelpRequestsView.as_view(), name='my-requests'),
    path('requests/create/', views.HelpRequestCreateView.as_view(), name='request-create'),
    
    # Тестовый endpoint
    path('test-register/', views.test_register, name='test-register'),
]