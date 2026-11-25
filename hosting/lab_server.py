"""Isolated synthetic hosting lab. No production data or external calls."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            body = json.dumps({"status": "ok", "service": "lts-hosting-lab", "environment": "synthetic"}).encode()
            self.send_body(200, "application/json", body)
        elif self.path == "/":
            self.send_body(200, "text/html; charset=utf-8", b"<!doctype html><meta charset=utf-8><title>LTS Hosting Lab</title><h1>LTS Hosting Lab</h1><p>Ambiente sintetico locale.</p>")
        else:
            self.send_body(404, "text/plain", b"Not found")

    def do_POST(self):
        self.send_body(405, "text/plain", b"Method not allowed")

    def send_body(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(body)

def create_server(port=8765):
    return ThreadingHTTPServer(("127.0.0.1", port), Handler)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LTS isolated hosting laboratory")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    with create_server(args.port) as server:
        print(f"Lab: http://127.0.0.1:{server.server_port}", flush=True)
        server.serve_forever()
