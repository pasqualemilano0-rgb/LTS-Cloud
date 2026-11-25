import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:")
db.executescript((Path(__file__).resolve().parents[1]/"database/cloud-core.sql").read_text())
sql="WITH RECURSIVE slots(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM slots WHERE n<20) INSERT INTO cloud_files(slot,name,body,sha256,created_at) SELECT n,?,?,?,? FROM slots WHERE n NOT IN (SELECT slot FROM cloud_files) ORDER BY n LIMIT 1 RETURNING slot"
for n in range(1,21):
    assert db.execute(sql,("sample.txt",b"abc","a"*64,"test")).fetchone()==(n,)
assert db.execute(sql,("sample.txt",b"abc","a"*64,"test")).fetchone() is None
assert db.execute("SELECT count(*) FROM cloud_files").fetchone()==(20,)
db.execute("DELETE FROM cloud_files WHERE slot=? AND sha256=? AND created_at=?",(1,"a"*64,"test"))
assert db.execute(sql,("sample.txt",b"abc","a"*64,"test")).fetchone()==(1,)
print("PASS D1-compatible SQLite: capacity and atomic allocation")
