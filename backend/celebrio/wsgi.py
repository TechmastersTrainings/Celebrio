import logging
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'celebrio.settings')
application = get_wsgi_application()

logger = logging.getLogger(__name__)

# Postgres advisory-lock key (arbitrary constant) so only one worker migrates at a time.
_MIGRATION_LOCK_KEY = 815_204_771


def _apply_pending_migrations():
    """
    Apply pending migrations when the app boots.

    The hosting platform's start command is configured outside this repo and does
    not run `migrate`, which left new tables/columns missing and caused HTTP 500s.
    Running here guarantees the schema matches the deployed code. Concurrent
    workers serialise on a Postgres advisory lock; the second one finds nothing
    to do. Failures are logged, never raised, so the site still boots.
    Disable with AUTO_MIGRATE=false.
    """
    if os.getenv('AUTO_MIGRATE', 'true').lower() in ('0', 'false', 'no'):
        return
    from django.core.management import call_command
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor

    try:
        executor = MigrationExecutor(connection)
        if not executor.migration_plan(executor.loader.graph.leaf_nodes()):
            return
        is_pg = connection.vendor == 'postgresql'
        with connection.cursor() as cur:
            if is_pg:
                cur.execute('SELECT pg_advisory_lock(%s)', [_MIGRATION_LOCK_KEY])
            try:
                logger.warning('Applying pending database migrations on startup...')
                call_command('migrate', interactive=False, verbosity=1)
                logger.warning('Startup migrations complete.')
            finally:
                if is_pg:
                    cur.execute('SELECT pg_advisory_unlock(%s)', [_MIGRATION_LOCK_KEY])
    except Exception:
        logger.exception('Startup migration failed; the app will continue to serve.')


_apply_pending_migrations()
