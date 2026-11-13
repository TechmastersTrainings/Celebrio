"""
Database-backed file storage.

The hosting platform's local disk is ephemeral: anything written to MEDIA_ROOT is
lost on every deploy or restart, which silently destroyed customer uploads.
Files are therefore stored in the database (the only persistent store the
deployment has) via this standard Django Storage backend, so every caller of
``default_storage`` keeps working unchanged.
"""
import mimetypes

from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class DatabaseStorage(Storage):
    def _model(self):
        from .models import StoredFile
        return StoredFile

    def _open(self, name, mode='rb'):
        row = self._model().objects.filter(name=name).only('content').first()
        if row is None:
            raise FileNotFoundError(name)
        f = ContentFile(bytes(row.content), name=name)
        f.mode = mode
        return f

    def _save(self, name, content):
        if hasattr(content, 'seek'):
            content.seek(0)
        data = content.read()
        if isinstance(data, str):
            data = data.encode()
        self._model().objects.update_or_create(
            name=name,
            defaults={
                'content': data,
                'size': len(data),
                'content_type': mimetypes.guess_type(name)[0] or 'application/octet-stream',
            },
        )
        return name

    def exists(self, name):
        return self._model().objects.filter(name=name).exists()

    def delete(self, name):
        self._model().objects.filter(name=name).delete()

    def size(self, name):
        row = self._model().objects.filter(name=name).only('size').first()
        if row is None:
            raise FileNotFoundError(name)
        return row.size

    def url(self, name):
        return None

    def listdir(self, path):
        prefix = path.rstrip('/') + '/' if path else ''
        dirs, files = set(), []
        for n in self._model().objects.filter(name__startswith=prefix).values_list('name', flat=True):
            rest = n[len(prefix):]
            if '/' in rest:
                dirs.add(rest.split('/', 1)[0])
            else:
                files.append(rest)
        return sorted(dirs), files
