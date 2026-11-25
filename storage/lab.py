"""Synthetic, ephemeral object store. No HTTP, no real authentication or external services."""
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
import re
import secrets

MAX_BYTES = 1024 * 1024
OWNERS = ("alice", "bob")
ALLOWED_FOLDERS = ("documents", "archive")
NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", re.ASCII)
OBJECT_ID = re.compile(r"[0-9a-f]{32}", re.ASCII)

class StorageLab:
    def __init__(self):
        self._temp = TemporaryDirectory(prefix="lts-storage-lab-")
        self._root = Path(self._temp.name)
        self._items = {}
        self._closed = False

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def close(self):
        self._closed = True
        self._items.clear()
        self._temp.cleanup()

    def _actor(self, actor):
        if self._closed:
            raise RuntimeError("Closed laboratory")
        if actor not in OWNERS:
            raise PermissionError("Access denied")

    def _get(self, actor, object_id):
        self._actor(actor)
        if not isinstance(object_id, str) or not OBJECT_ID.fullmatch(object_id):
            raise FileNotFoundError("Object not found")
        item = self._items.get(object_id)
        if not item or item["owner"] != actor:
            raise FileNotFoundError("Object not found")
        return item

    def put(self, actor, folder, name, data):
        self._actor(actor)
        if folder not in ALLOWED_FOLDERS:
            raise ValueError("Invalid folder")
        if not isinstance(name, str) or not NAME.fullmatch(name) or ".." in name:
            raise ValueError("Invalid name")
        if not isinstance(data, bytes) or not 0 < len(data) <= MAX_BYTES:
            raise ValueError("Invalid file size or type")
        if len(self._items) >= 20:
            raise ValueError("Lab object limit reached")
        object_id = secrets.token_hex(16)
        with (self._root / object_id).open("xb") as out:
            out.write(data)
        self._items[object_id] = {"id":object_id,"owner":actor,"folder":folder,"name":name,"size":len(data),"sha256":sha256(data).hexdigest()}
        return object_id

    def list(self, actor, folder=None):
        self._actor(actor)
        if folder is not None and folder not in ALLOWED_FOLDERS:
            raise ValueError("Invalid folder")
        return [dict(item) for item in self._items.values() if item["owner"] == actor and (folder is None or item["folder"] == folder)]

    def get(self, actor, object_id):
        item = self._get(actor, object_id)
        data = (self._root / object_id).read_bytes()
        if len(data) != item["size"] or sha256(data).hexdigest() != item["sha256"]:
            raise ValueError("Integrity check failed")
        return data

    def delete(self, actor, object_id):
        self._get(actor, object_id)
        (self._root / object_id).unlink()
        del self._items[object_id]
