from django.urls import path

from . import views

urlpatterns = [
    path('options/', views.VenueOptionsView.as_view(), name='venue_options'),
    path('countries/', views.CountryListView.as_view(), name='countries'),
    path('states/', views.StateListView.as_view(), name='states'),
    path('cities/', views.CityListView.as_view(), name='cities'),
    path('localities/', views.LocalityListView.as_view(), name='localities'),
    path('localities/<int:locality_id>/nearby/', views.NearbyLocalitiesView.as_view(), name='nearby_localities'),
    path('venues/search/', views.VenueSearchView.as_view(), name='venue_search'),

    path('admin/venues/', views.AdminVenueListView.as_view(), name='admin_venues'),
    path('admin/venues/<uuid:venue_id>/', views.AdminVenueDetailView.as_view(), name='admin_venue_detail'),
    path('admin/venues/<uuid:venue_id>/verify/', views.AdminVenueVerifyView.as_view(), name='admin_venue_verify'),
    path('admin/localities/', views.AdminLocalityListView.as_view(), name='admin_localities'),
    path('admin/localities/<int:locality_id>/', views.AdminLocalityDetailView.as_view(), name='admin_locality_detail'),
]
