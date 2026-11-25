#!/usr/bin/env bash
set -euo pipefail
# Never use an existing database, network endpoint or credential.
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bin=/usr/lib/postgresql/16/bin
test "$(id -u)" -ne 0
test -x "$bin/initdb"
tmp="$(mktemp -d)"
chmod 700 "$tmp"
mkdir -m 700 "$tmp/socket"
trap '"$bin/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf -- "$tmp"' EXIT
"$bin/initdb" -D "$tmp/data" --auth-local=peer --auth-host=reject --no-locale >/dev/null
"$bin/pg_ctl" -D "$tmp/data" -l "$tmp/log" -o "-c listen_addresses='' -c unix_socket_directories=$tmp/socket -c unix_socket_permissions=0700" -w start
"$bin/psql" -X -v ON_ERROR_STOP=1 -h "$tmp/socket" -p 5432 -U "$(id -un)" -d postgres -f "$root/database/lab_schema.sql"
"$bin/psql" -X -v ON_ERROR_STOP=1 -h "$tmp/socket" -p 5432 -U "$(id -un)" -d postgres -f "$root/tests/database_lab.sql"
