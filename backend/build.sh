#!/usr/bin/env bash
# Exit on any failure
set -o errexit

echo "===> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "===> Collecting static assets..."
python manage.py collectstatic --no-input

echo "===> Running database migrations..."
python manage.py migrate --no-input

echo "===> Seeding catalog and default staff accounts..."
python manage.py seed_catalog || true

echo "===> Build completed successfully!"
