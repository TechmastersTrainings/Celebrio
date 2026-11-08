from django.urls import path
from .views import (
    AdminPublishAuthorizeView,
    PublicInvitationDetailView,
    PreviewInvitationDetailView
)

urlpatterns = [
    path('authorize/', AdminPublishAuthorizeView.as_view(), name='publishing_authorize'),
    path('invite/<slug:slug>/', PublicInvitationDetailView.as_view(), name='public_invite_detail'),
    path('preview/<str:token>/', PreviewInvitationDetailView.as_view(), name='preview_invite_detail'),
]

