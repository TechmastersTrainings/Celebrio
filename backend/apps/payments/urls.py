from django.urls import path
from .views import PaymentOrderCreateView, PaymentWebhookView

urlpatterns = [
    path('create-order/', PaymentOrderCreateView.as_view(), name='payment_order_create'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),
]

