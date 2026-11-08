import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path and Django settings are configured
# when accessed directly from terminal or external scripts
backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if not os.getenv('DJANGO_SETTINGS_MODULE'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'celebrio.settings')
    try:
        import django
        django.setup()
    except Exception:
        pass

from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
try:
    from .models import Occasion, Package, Addon, Template
    from .serializers import OccasionSerializer, PackageSerializer, AddonSerializer, TemplateSerializer
except (ImportError, ValueError):
    from apps.catalog.models import Occasion, Package, Addon, Template
    from apps.catalog.serializers import OccasionSerializer, PackageSerializer, AddonSerializer, TemplateSerializer

try:
    from apps.accounts.permissions import IsAdminUserRole
    from apps.audit.services import log_activity
except (ImportError, ValueError):
    from ..accounts.permissions import IsAdminUserRole
    from ..audit.services import log_activity

class OccasionListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Occasion.objects.filter(is_active=True).prefetch_related('packages', 'templates')
    serializer_class = OccasionSerializer

class PackageListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PackageSerializer

    def get_queryset(self):
        qs = Package.objects.filter(is_active=True)
        occasion_slug = self.request.query_params.get('occasion_slug')
        if occasion_slug:
            qs = qs.filter(occasion__slug=occasion_slug)
        return qs

class AddonListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Addon.objects.filter(is_active=True)
    serializer_class = AddonSerializer

class AdminPackageUpdateView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, package_id):
        try:
            package = Package.objects.get(id=package_id)
        except Package.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Package not found'}}, status=status.HTTP_404_NOT_FOUND)

        old_price = str(package.base_price_inr)
        serializer = PackageSerializer(package, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_package = serializer.save()

        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='PACKAGE_PRICE_UPDATED',
            module='CATALOG',
            record_id=str(package.id),
            previous_value={'base_price_inr': old_price},
            new_value={'base_price_inr': str(updated_package.base_price_inr)},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS',
            remarks=f"Admin updated package {package.name} price."
        )

        return Response({'success': True, 'data': PackageSerializer(updated_package).data})

