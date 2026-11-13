#!/usr/bin/env bash
# Exit on critical failure
set -e

echo "===> Celebrio Production Startup Initiated..."

# Apply database migrations against the live database.
# Retries cover a cold/waking Postgres instance. If migrations still fail we
# abort startup so the platform keeps the previous healthy deploy instead of
# serving new code against a stale schema (which caused HTTP 500s).
echo "===> Applying database migrations..."
for attempt in 1 2 3 4 5; do
  if python manage.py migrate --no-input; then
    echo "===> Migrations applied."
    break
  fi
  if [ "$attempt" -eq 5 ]; then
    echo "!!!! Database migrations failed after $attempt attempts. Aborting startup."
    exit 1
  fi
  echo "===> Migration attempt $attempt failed; retrying in 5s..."
  sleep 5
done
python manage.py showmigrations --plan | grep '\[ \]' && echo "!!!! Unapplied migrations remain" || true

# Seed default occasions, packages, add-ons, and admin/developer accounts
echo "===> Seeding catalog and default staff accounts..."
python manage.py seed_catalog || echo "!!!! seed_catalog failed (non-fatal)"

# Collect static files if not already collected
echo "===> Verifying static assets..."
python manage.py collectstatic --no-input

echo "===> Launching Gunicorn WSGI server on port ${PORT:-8000}..."
exec gunicorn celebrio.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
