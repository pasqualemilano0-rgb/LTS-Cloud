CREATE TABLE IF NOT EXISTS cloud_meta (id INTEGER PRIMARY KEY CHECK(id=1), schema_version INTEGER NOT NULL, created_at TEXT NOT NULL);
INSERT OR IGNORE INTO cloud_meta VALUES (1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
CREATE TABLE IF NOT EXISTS cloud_files (slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 20), name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100), body BLOB NOT NULL CHECK(length(body)<=65536), sha256 TEXT NOT NULL CHECK(length(sha256)=64), created_at TEXT NOT NULL);
