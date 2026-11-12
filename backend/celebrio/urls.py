from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/catalog/', include('apps.catalog.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/workspace/', include('apps.workspace_urls')),
    path('api/v1/tickets/', include('apps.tickets.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/admin-ops/', include('apps.admin_ops_urls')),
    path('api/v1/publishing/', include('apps.publishing.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

