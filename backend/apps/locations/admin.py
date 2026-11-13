from django.contrib import admin

from .models import City, Country, Locality, State, Venue


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'city', 'locality', 'verification_status', 'is_active', 'data_source', 'last_verified_at')
    list_filter = ('verification_status', 'is_active', 'category', 'data_source', 'city')
    search_fields = ('name', 'full_address')


@admin.register(Locality)
class LocalityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'latitude', 'longitude', 'is_active')
    list_filter = ('city', 'is_active')
    search_fields = ('name',)
    filter_horizontal = ('nearby_localities',)


admin.site.register([Country, State, City])
