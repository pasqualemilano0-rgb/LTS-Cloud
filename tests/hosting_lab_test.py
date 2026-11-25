import importlib.util
import json
from pathlib import Path
from threading import Thread
from urllib.request import urlopen, Request
from urllib.error import HTTPError

path = Path(__file__).resolve().parents[1] / "hosting" / "lab_server.py"
spec = importlib.util.spec_from_file_location("lab_server", path)
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)
with lab.create_server(0) as server:
    assert server.server_address[0] == "127.0.0.1"
    t = Thread(target=server.serve_forever, daemon=True)
    t.start()
    url = f"http://127.0.0.1:{server.server_port}"
    try:
        with urlopen(url + "/health", timeout=3) as r:
            assert r.status == 200
            assert r.headers["Cache-Control"] == "no-store"
            assert json.load(r) == {"status":"ok","service":"lts-hosting-lab","environment":"synthetic"}
        with urlopen(url + "/", timeout=3) as r:
            assert b"Ambiente sintetico locale" in r.read()
        for request, code in [(Request(url + "/missing"),404),(Request(url + "/health",method="POST"),405)]:
            try:
                urlopen(request, timeout=3)
                raise AssertionError("Unexpected success")
            except HTTPError as error:
                assert error.code == code
    finally:
        server.shutdown()
        t.join()
print("PASS isolated hosting HTTP lab: loopback, health, root, 404, 405")
