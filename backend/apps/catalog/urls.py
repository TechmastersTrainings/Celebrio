from django.urls import path
from .views import OccasionListView, PackageListView, AddonListView, AdminPackageUpdateView

urlpatterns = [
    path('occasions/', OccasionListView.as_view(), name='catalog_occasions'),
    path('packages/', PackageListView.as_view(), name='catalog_packages'),
    path('addons/', AddonListView.as_view(), name='catalog_addons'),
    path('packages/<uuid:package_id>/', AdminPackageUpdateView.as_view(), name='admin_package_update'),
]

