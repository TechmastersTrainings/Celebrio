#!/usr/bin/env bash
# Exit on critical failure
set -e

echo "===> Celebrio Production Startup Initiated..."

# Run database migrations against the live database
echo "===> Applying database migrations..."
python manage.py migrate --no-input

# Seed default occasions, packages, add-ons, and admin/developer accounts
echo "===> Seeding catalog and default staff accounts..."
python manage.py seed_catalog

# Collect static files if not already collected
echo "===> Verifying static assets..."
python manage.py collectstatic --no-input

echo "===> Launching Gunicorn WSGI server on port ${PORT:-8000}..."
exec gunicorn celebrio.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
