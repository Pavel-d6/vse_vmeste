from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'funds', views.CharityFundViewSet, basename='fund')
router.register(r'help-requests', views.HelpRequestViewSet)
router.register(r'fundraisers', views.FundraiserViewSet, basename='fundraiser')

urlpatterns = [
    path('', include(router.urls)),
    path('overview/', views.api_overview, name='api-overview'),
    
    # Аутентификация
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Заявки пользователя
    path('my-requests/', views.UserHelpRequestsView.as_view(), name='my-requests'),
    path('requests/create/', views.HelpRequestCreateView.as_view(), name='request-create'),
    
    # Фонды создателя
    path('my-funds/', views.MyFundsView.as_view(), name='my-funds'),
    path('my-fundraisers/', views.MyFundraisersView.as_view(), name='my-fundraisers'),
    
    # Админка
    path('admin/pending-funds/', views.AdminPendingFundsView.as_view(), name='admin-pending-funds'),
]