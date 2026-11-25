import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:")
db.executescript((Path(__file__).resolve().parents[1]/"database/action-quota.sql").read_text())
q="INSERT INTO action_quota(id,day,used,last_ms) VALUES(1,?,1,?) ON CONFLICT(id) DO UPDATE SET day=excluded.day,used=CASE WHEN action_quota.day=excluded.day THEN action_quota.used+1 ELSE 1 END,last_ms=excluded.last_ms WHERE excluded.last_ms-action_quota.last_ms>=30000 AND (action_quota.day<>excluded.day OR action_quota.used<10) RETURNING used"
for i in range(10):
    assert db.execute(q,("2026-01-01",100000+i*30000)).fetchone()==(i+1,)
    assert db.execute(q,("2026-01-01",100001+i*30000)).fetchone() is None
assert db.execute(q,("2026-01-01",500000)).fetchone() is None
assert db.execute(q,("2026-01-02",600000)).fetchone()==(1,)
print("PASS pipeline quota: atomic daily limit and cooldown")
