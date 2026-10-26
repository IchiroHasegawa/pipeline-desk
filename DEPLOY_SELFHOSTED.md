# Production OS — self-hosted deployment

This branch (`deploy/tneuserver`) adds what the app needs to run on a plain
Docker host behind a reverse proxy, instead of on Vercel + Supabase Cloud.
`DEPLOYMENT.md` still describes the Vercel path and is unchanged.

Nothing in `app/`, `components/` or the migrations was altered to make this
work. The application changes are three server-side files picking up an
optional internal Supabase URL (below).

## What this branch adds

| File | Why |
|---|---|
| `next.config.ts` | `output: "standalone"` — the Docker image copies `.next/standalone`, which is not produced without it |
| `Dockerfile` | Multi-stage build → minimal `node:22-alpine` runner on `server.js` |
| `.dockerignore` | Keeps `design-reference/` (1.9 MB prototype) and `.env*` out of the build context |
| `docker-compose.prod.yml` | App container, loopback-only port, joins the Supabase network |
| `deploy.sh` | `git pull --ff-only` + rebuild + health gate |
| `scripts/apply-migrations.sh` | Replays all migrations against a fresh database |
| `supabase/deploy-patches/026a_…sql` | Makes migration 027 applicable — see below |
| `lib/supabase/server-url.ts` | Optional `SUPABASE_INTERNAL_URL` for server-side calls |

## The one application change

`lib/supabase/{server,admin,middleware}.ts` now read the Supabase base URL
from `lib/supabase/server-url.ts`, which prefers `SUPABASE_INTERNAL_URL` and
falls back to `NEXT_PUBLIC_SUPABASE_URL`. **If you don't set
`SUPABASE_INTERNAL_URL`, behaviour is byte-for-byte what it was.**

It exists because `proxy.ts` → `updateSession()` calls `auth.getUser()` plus a
`profiles` lookup on *every* request. With a single public URL, every page load
would leave the server, cross the public reverse proxy, and come back — and
server-rendering would break whenever the proxy restarted. The browser still
uses the public `NEXT_PUBLIC_SUPABASE_URL`; only server-side calls take the
internal route.

## Migration 027 cannot be replayed — read this

`027_workflow_task_safety.sql` adds a `UNIQUE NULLS NOT DISTINCT` constraint on
`production_tasks`, but `003_seed_production_data.sql` seeds 11 demo tasks
across two scenes, all with `source_workflow_process_id = NULL`. Under
`NULLS NOT DISTINCT` those are 7 + 4 collisions, so **027 fails on any database
built by replaying these migrations in order**:

```
ERROR: could not create unique index "uq_production_task_process"
DETAIL: Key (environment_id, episode_id, scene_id, source_workflow_process_id)
        =(null, null, 20000000-0000-4000-8000-000000000001, null) is duplicated.
```

The constraint isn't optional — `generate_workflow_tasks()` depends on
`uq_production_task_process` / `uq_asset_task_process` for its idempotent
`ON CONFLICT` upserts. `supabase/deploy-patches/026a_seed_task_constraint_fix.sql`
deletes the demo task rows (keeping demo projects/episodes/scenes/assets) so
027 applies. A tidier upstream fix would be to make the constraint partial
(`WHERE source_workflow_process_id IS NOT NULL`) or give the seeded tasks real
workflow processes.

Verified final schema after a full replay: 23 tables, 26 RLS policies, 3 views,
both unique indexes present, exactly one `generate_workflow_tasks` overload,
and zero surviving references to the dead `ON CONFLICT ON CONSTRAINT`.

## Environment

`.env` next to `docker-compose.prod.yml`, `chmod 600`, never committed.

```ini
# Supabase — browser-facing (inlined into the client bundle at build time)
NEXT_PUBLIC_SUPABASE_URL=https://<supabase-public-host>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key>

# Supabase — server-side only
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
SUPABASE_INTERNAL_URL=http://api-gw:8000

# App
APP_URL=https://<app-host>
PRODUCTION_OS_DEPLOYMENT_MODE=staging
PRODUCTION_OS_TEST_ACCESS_ENABLED=true
PRODUCTION_OS_TEST_ACCESS_CODE=<secret>

# Google Drive — unset for now; Drive-backed asset features return errors
# until these are filled in and the image is rebuilt.
# GOOGLE_DRIVE_CLIENT_ID=
# GOOGLE_DRIVE_CLIENT_SECRET=
# GOOGLE_DRIVE_REDIRECT_URI=https://<app-host>/api/google-drive/callback
# GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY=
```

> `DEPLOYMENT.md` lists `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The code actually reads
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase/client.ts`). The code
> is authoritative; that doc line is stale.

### Why some vars are build args too

`NEXT_PUBLIC_*` must be build args — Next inlines them at build time.
`PRODUCTION_OS_TEST_ACCESS_ENABLED` and `PRODUCTION_OS_TEST_ACCESS_CODE` are
*also* passed as build args because they are read from the proxy, and an
undefined `PRODUCTION_OS_TEST_ACCESS_ENABLED` makes the staging gate fail
**open**. They are therefore baked into the image — treat the image as
sensitive, and rebuild after changing the access code.

## First deploy

```bash
# 1. Supabase stack (separate compose project, so app redeploys never touch the DB)
cd /home/ameya/docker/productionos-db && docker compose -p productionos-db up -d

# 2. Schema
cd /home/ameya/docker/productionos && ./scripts/apply-migrations.sh

# 3. App
./deploy.sh
```

## Redeploy

```bash
cd /home/ameya/docker/productionos && ./deploy.sh
```

## Runbook

```bash
docker compose -f docker-compose.prod.yml logs -f --tail 50
docker compose -p productionos-db -f /home/ameya/docker/productionos-db/docker-compose.yml ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8093/test-access   # 200
docker exec -i supabase-db psql -U postgres -d postgres -c '\dt public.*'
```
