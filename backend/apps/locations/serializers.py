from rest_framework import serializers

from .models import City, Country, Locality, State, Venue


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'iso_code']


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name', 'country']


class CitySerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)

    class Meta:
        model = City
        fields = ['id', 'name', 'state', 'state_name', 'latitude', 'longitude']


class LocalitySerializer(serializers.ModelSerializer):
    has_coordinates = serializers.BooleanField(read_only=True)

    class Meta:
        model = Locality
        fields = ['id', 'name', 'city', 'pincode', 'has_coordinates']


class AdminLocalitySerializer(serializers.ModelSerializer):
    has_coordinates = serializers.BooleanField(read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    nearby_localities = serializers.PrimaryKeyRelatedField(many=True, queryset=Locality.objects.all(), required=False)
    venue_count = serializers.SerializerMethodField()

    class Meta:
        model = Locality
        fields = [
            'id', 'name', 'city', 'city_name', 'pincode', 'latitude', 'longitude',
            'has_coordinates', 'nearby_localities', 'data_source', 'is_active', 'venue_count',
        ]
        read_only_fields = ['id', 'data_source']

    def get_venue_count(self, obj):
        return obj.venues.count()

    def validate(self, attrs):
        lat = attrs.get('latitude', getattr(self.instance, 'latitude', None))
        lng = attrs.get('longitude', getattr(self.instance, 'longitude', None))
        if (lat is None) != (lng is None):
            raise serializers.ValidationError('Provide both latitude and longitude, or neither.')
        city = attrs.get('city', getattr(self.instance, 'city', None))
        for n in attrs.get('nearby_localities', []):
            if city and n.city_id != city.id:
                raise serializers.ValidationError({'nearby_localities': f'{n.name} is in a different city.'})
            if self.instance and n.id == self.instance.id:
                raise serializers.ValidationError({'nearby_localities': 'A locality cannot be near itself.'})
        return attrs


class AdminVenueSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    verification_status_label = serializers.CharField(source='get_verification_status_display', read_only=True)
    data_source_label = serializers.CharField(source='get_data_source_display', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    locality_name = serializers.CharField(source='locality.name', read_only=True, default=None)
    verified_by_name = serializers.CharField(source='verified_by.full_name', read_only=True, default=None)
    order_event_count = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'category', 'category_label', 'city', 'city_name', 'locality', 'locality_name',
            'full_address', 'latitude', 'longitude', 'google_maps_url', 'contact_phone', 'contact_verified',
            'verification_status', 'verification_status_label', 'is_active', 'data_source', 'data_source_label',
            'external_place_id', 'last_verified_at', 'verified_by_name', 'admin_notes', 'order_event_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'verification_status', 'last_verified_at', 'verified_by_name', 'external_place_id',
            'created_at', 'updated_at',
        ]

    def get_order_event_count(self, obj):
        return obj.order_events.count() if hasattr(obj, 'order_events') else 0

    def validate(self, attrs):
        lat = attrs.get('latitude', getattr(self.instance, 'latitude', None))
        lng = attrs.get('longitude', getattr(self.instance, 'longitude', None))
        if (lat is None) != (lng is None):
            raise serializers.ValidationError('Provide both latitude and longitude, or neither.')
        city = attrs.get('city', getattr(self.instance, 'city', None))
        locality = attrs.get('locality', getattr(self.instance, 'locality', None))
        if locality and city and locality.city_id != city.id:
            raise serializers.ValidationError({'locality': 'Locality does not belong to the selected city.'})
        if not (attrs.get('name', getattr(self.instance, 'name', '')) or '').strip():
            raise serializers.ValidationError({'name': 'Venue name is required.'})
        return attrs
