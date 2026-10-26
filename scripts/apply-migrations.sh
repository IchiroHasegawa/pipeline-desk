#!/usr/bin/env bash
# Build the Production OS schema from scratch against a self-hosted Supabase
# Postgres, applying supabase/migrations in lexical order with the deploy
# patches in supabase/deploy-patches slotted in at the right points.
#
#   ./scripts/apply-migrations.sh [container]      # default: supabase-db
#
# Idempotent only in the sense that most individual migrations are; it is
# intended for a FRESH database. Stops at the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER="${1:-supabase-db}"
MIG=supabase/migrations
PATCHES=supabase/deploy-patches

psql_file() {
  docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$1"
}

# Patches keyed by the migration they must run AFTER.
declare -A AFTER=(
  [026_workflow_updates_and_seeds.sql]="$PATCHES/026a_seed_task_constraint_fix.sql"
)

fail=0
for f in $(ls "$MIG"/*.sql | sort); do
  base="$(basename "$f")"
  if psql_file "$f" >/dev/null 2>&1; then
    printf 'OK    %s\n' "$base"
  else
    printf 'FAIL  %s\n' "$base" >&2
    psql_file "$f" 2>&1 | head -5 >&2
    fail=1
    break
  fi

  if [ -n "${AFTER[$base]:-}" ]; then
    p="${AFTER[$base]}"
    if psql_file "$p" >/dev/null 2>&1; then
      printf 'OK    %s  (deploy patch)\n' "$(basename "$p")"
    else
      printf 'FAIL  %s  (deploy patch)\n' "$(basename "$p")" >&2
      fail=1
      break
    fi
  fi
done

[ "$fail" -eq 0 ] || { echo "migration run aborted" >&2; exit 1; }

docker exec "$CONTAINER" psql -U postgres -d postgres -qc "NOTIFY pgrst, 'reload schema'" >/dev/null
echo ">> all migrations applied; PostgREST schema cache reloaded"
