from django.urls import path
from .views import (
    OrderCreateView,
    OrderLookupView,
    CardOCRExtractView,
    PublicCouponsListView,
    CouponValidateView,
    AdminCouponListView,
    AdminCouponDetailView,
    CallbackRequestCreateView,
    AdminCallbackListView,
    AdminCallbackDetailView,
    AdminOrderMissingInfoUpdateView,
    CustomerAssetUploadView,
    CustomerAssetDownloadView,
    CustomerDesignApproveView,
    CustomerRevisionRequestView,
    CustomerDeliverablesView,
)

urlpatterns = [
    # Core Order Processing
    path('', OrderCreateView.as_view(), name='order_create'),
    path('lookup/', OrderLookupView.as_view(), name='order_lookup'),
    path('ocr-extract/', CardOCRExtractView.as_view(), name='order_ocr_extract'),

    # Offers & Coupons
    path('coupons/public/', PublicCouponsListView.as_view(), name='public_coupons'),
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon_validate'),
    path('coupons/admin/', AdminCouponListView.as_view(), name='admin_coupons_list'),
    path('coupons/admin/<uuid:coupon_id>/', AdminCouponDetailView.as_view(), name='admin_coupon_detail'),

    # Customer Support & Callbacks
    path('callbacks/', CallbackRequestCreateView.as_view(), name='callback_create'),
    path('callbacks/admin/', AdminCallbackListView.as_view(), name='admin_callbacks_list'),
    path('callbacks/admin/<uuid:callback_id>/', AdminCallbackDetailView.as_view(), name='admin_callback_detail'),

    # Requirements & Missing Info Management
    path('<str:order_ref>/missing-info/', AdminOrderMissingInfoUpdateView.as_view(), name='order_missing_info'),

    # Attachments & Deliverables
    path('<str:order_ref>/assets/', CustomerAssetUploadView.as_view(), name='customer_asset_upload'),
    path('assets/<uuid:asset_id>/download/', CustomerAssetDownloadView.as_view(), name='customer_asset_download'),
    path('assets/<uuid:asset_id>/preview/', CustomerAssetDownloadView.as_view(), name='customer_asset_preview'),
    path('<str:order_ref>/approve-design/', CustomerDesignApproveView.as_view(), name='customer_design_approve'),
    path('<str:order_ref>/revisions/', CustomerRevisionRequestView.as_view(), name='customer_revision_request'),
    path('<str:order_ref>/deliverables/', CustomerDeliverablesView.as_view(), name='customer_deliverables'),
]
