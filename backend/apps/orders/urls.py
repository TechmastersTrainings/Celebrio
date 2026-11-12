from django.urls import path
from .views import (
    OrderCreateView,
    OrderLookupView,
    CustomerAssetUploadView,
    CustomerAssetDownloadView,
    CustomerDesignApproveView,
    CustomerRevisionRequestView,
    CustomerDeliverablesView
)

urlpatterns = [
    path('', OrderCreateView.as_view(), name='order_create'),
    path('lookup/', OrderLookupView.as_view(), name='order_lookup'),
    path('<str:order_ref>/assets/', CustomerAssetUploadView.as_view(), name='customer_asset_upload'),
    path('assets/<uuid:asset_id>/download/', CustomerAssetDownloadView.as_view(), name='customer_asset_download'),
    path('assets/<uuid:asset_id>/preview/', CustomerAssetDownloadView.as_view(), name='customer_asset_preview'),
    path('<str:order_ref>/approve-design/', CustomerDesignApproveView.as_view(), name='customer_design_approve'),
    path('<str:order_ref>/revisions/', CustomerRevisionRequestView.as_view(), name='customer_revision_request'),
    path('<str:order_ref>/deliverables/', CustomerDeliverablesView.as_view(), name='customer_deliverables'),
]

