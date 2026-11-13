"""
Seed the initial location dataset: India > Karnataka > Bidar and its localities.

Deliberately seeds NO venues and NO coordinates. Venue records must be added and
verified by an administrator; coordinates and nearby-locality links are curated
in the Admin Portal so that no distance or venue is ever invented.
Idempotent (get_or_create), so admins can rename/deactivate freely afterwards.
"""
from django.db import migrations

BIDAR_LOCALITIES = [
    'Gumpa',
    'Shahganj',
    'Mailoor',
    'Old City',
    'Naubad',
    'Chidri',
    'Gandhi Gunj',
    'Nawadgeri',
    'Mangalpet',
    'Shivnagar',
    'Chikpet',
]


def seed(apps, schema_editor):
    Country = apps.get_model('locations', 'Country')
    State = apps.get_model('locations', 'State')
    City = apps.get_model('locations', 'City')
    Locality = apps.get_model('locations', 'Locality')

    india, _ = Country.objects.get_or_create(name='India', defaults={'iso_code': 'IN'})
    karnataka, _ = State.objects.get_or_create(country=india, name='Karnataka')
    bidar, _ = City.objects.get_or_create(state=karnataka, name='Bidar')
    for name in BIDAR_LOCALITIES:
        Locality.objects.get_or_create(city=bidar, name=name, defaults={'data_source': 'SEED'})


class Migration(migrations.Migration):
    dependencies = [('locations', '0001_initial')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
