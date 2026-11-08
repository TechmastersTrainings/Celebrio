from rest_framework import serializers
from .models import Occasion, Package, Addon, Template

class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = [
            'id',
            'occasion',
            'name',
            'code',
            'base_price_inr',
            'features_json',
            'included_revisions',
            'is_active',
            'created_at',
        ]

class AddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addon
        fields = [
            'id',
            'name',
            'code',
            'price_inr',
            'addon_type',
            'description',
            'is_active',
        ]

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            'id',
            'occasion',
            'name',
            'code',
            'preview_image_url',
            'theme_config_json',
            'is_active',
        ]

class OccasionSerializer(serializers.ModelSerializer):
    packages = serializers.SerializerMethodField()
    templates = TemplateSerializer(many=True, read_only=True)

    class Meta:
        model = Occasion
        fields = [
            'id',
            'slug',
            'display_name',
            'description',
            'is_active',
            'sort_order',
            'icon_name',
            'packages',
            'templates',
        ]

    def get_packages(self, obj):
        packages = obj.packages.filter(is_active=True)
        return PackageSerializer(packages, many=True).data

