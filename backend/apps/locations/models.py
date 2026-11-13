"""
Location hierarchy (Country > State > City > Locality) and the venue directory.

Design notes
------------
* Localities are a managed dataset (admin-editable), never a hardcoded frontend list.
* Coordinates are optional everywhere. Distances are only ever computed when BOTH
  points carry real coordinates, so the product never displays an invented distance.
* "Nearby" relationships between localities are either curated by an admin
  (``Locality.nearby_localities``) or derived from real coordinates.
* Only ``VERIFIED`` + active venues are shown to customers. Customer-submitted and
  external-provider venues enter the directory as ``PENDING`` for admin review.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    iso_code = models.CharField(max_length=3, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'location_countries'
        ordering = ['name']
        verbose_name_plural = 'countries'

    def __str__(self):
        return self.name


class State(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'location_states'
        ordering = ['name']
        unique_together = [('country', 'name')]

    def __str__(self):
        return f"{self.name}, {self.country.name}"


class City(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'location_cities'
        ordering = ['name']
        unique_together = [('state', 'name')]
        verbose_name_plural = 'cities'

    def __str__(self):
        return f"{self.name}, {self.state.name}"


class Locality(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='localities')
    name = models.CharField(max_length=120)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # Admin-curated adjacency. Symmetrical: if Gumpa is near Shahganj, Shahganj is near Gumpa.
    nearby_localities = models.ManyToManyField('self', blank=True, symmetrical=True)
    data_source = models.CharField(max_length=40, default='ADMIN')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'location_localities'
        ordering = ['name']
        unique_together = [('city', 'name')]
        verbose_name_plural = 'localities'

    def __str__(self):
        return f"{self.name} ({self.city.name})"

    @property
    def has_coordinates(self):
        return self.latitude is not None and self.longitude is not None


class VenueCategory(models.TextChoices):
    FUNCTION_HALL = 'FUNCTION_HALL', 'Function Hall / Convention Hall'
    HOTEL_RESORT = 'HOTEL_RESORT', 'Hotel / Resort'
    RESTAURANT_BANQUET = 'RESTAURANT_BANQUET', 'Restaurant / Banquet'
    OUTDOOR = 'OUTDOOR', 'Outdoor Venue'
    OTHER = 'OTHER', 'Other Venue'


class VenueType(models.TextChoices):
    """What the customer picks on the order form (superset of VenueCategory)."""
    HOME = 'HOME', 'Home Sweet Home'
    FUNCTION_HALL = 'FUNCTION_HALL', 'Function Hall / Convention Hall'
    HOTEL_RESORT = 'HOTEL_RESORT', 'Hotel / Resort'
    RESTAURANT_BANQUET = 'RESTAURANT_BANQUET', 'Restaurant / Banquet'
    OUTDOOR = 'OUTDOOR', 'Outdoor Venue'
    OTHER = 'OTHER', 'Other Venue'


class VerificationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Review'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'


class VenueDataSource(models.TextChoices):
    ADMIN = 'ADMIN', 'Added by Administrator'
    CUSTOMER_PROVIDED = 'CUSTOMER_PROVIDED', 'Customer Provided'
    EXTERNAL_PROVIDER = 'EXTERNAL_PROVIDER', 'External Places Provider'
    IMPORT = 'IMPORT', 'Bulk Import'


class Venue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=30, choices=VenueCategory.choices, default=VenueCategory.FUNCTION_HALL, db_index=True)
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name='venues')
    locality = models.ForeignKey(Locality, on_delete=models.SET_NULL, null=True, blank=True, related_name='venues')
    full_address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    google_maps_url = models.URLField(max_length=500, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_verified = models.BooleanField(default=False, help_text='Only verified contact details are shown to customers.')
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    data_source = models.CharField(max_length=30, choices=VenueDataSource.choices, default=VenueDataSource.ADMIN)
    external_place_id = models.CharField(max_length=255, blank=True, db_index=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_venues')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'venues'
        ordering = ['name']
        indexes = [models.Index(fields=['city', 'verification_status', 'is_active'])]

    def __str__(self):
        return f"{self.name} [{self.get_verification_status_display()}]"

    @property
    def is_public(self):
        return self.is_active and self.verification_status == VerificationStatus.VERIFIED

    @property
    def has_coordinates(self):
        return self.latitude is not None and self.longitude is not None
