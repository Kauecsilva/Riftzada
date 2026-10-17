#!/usr/bin/env bash
# Aplica as migrations + seed num banco descartável e roda as asserções de RLS e views.
# Uso: tests/sql/run.sh   (precisa de um Postgres local; PGUSER/PGHOST pelo ambiente)
set -euo pipefail
DB=riftzada_test
cd "$(dirname "$0")/../.."
dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X -d "$DB")
"${PSQL[@]}" -f tests/sql/supabase-stub.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -o /dev/null -f tests/sql/assertions.sql
echo "SQL: tudo certo"
