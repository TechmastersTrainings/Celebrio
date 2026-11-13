"""
Apply the official catalog (apps/catalog/catalog_data.py):
- all packages priced at ₹399 / ₹499 / ₹599 only, with no paid add-ons
- new occasions: House Warming, Baby Shower, Religious & Cultural Celebrations,
  Digital Invitation Websites, Digital Invitation Cards, Animated Invitation Videos
- Instagram Story / Post / Reel-ready deliverables in package features
"""
from django.db import migrations


def forwards(apps, schema_editor):
    from apps.catalog.catalog_data import apply_catalog

    apply_catalog(
        apps.get_model('catalog', 'Occasion'),
        apps.get_model('catalog', 'Package'),
        apps.get_model('catalog', 'Template'),
        apps.get_model('catalog', 'Addon'),
    )


class Migration(migrations.Migration):
    dependencies = [('catalog', '0001_initial')]
    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
