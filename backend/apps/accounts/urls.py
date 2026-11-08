from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    DeveloperRegisterView,
    DeveloperMeView,
    CustomerSendOTPView,
    CustomerVerifyOTPView,
    AdminDeveloperListView,
    AdminDeveloperActionView
)

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('developer/register/', DeveloperRegisterView.as_view(), name='developer_register'),
    path('developer/me/', DeveloperMeView.as_view(), name='developer_me'),
    path('customer/otp/send/', CustomerSendOTPView.as_view(), name='customer_otp_send'),
    path('customer/otp/verify/', CustomerVerifyOTPView.as_view(), name='customer_otp_verify'),
    path('admin/developers/', AdminDeveloperListView.as_view(), name='admin_developer_list'),
    path('admin/developers/<uuid:user_id>/action/', AdminDeveloperActionView.as_view(), name='admin_developer_action'),
]

