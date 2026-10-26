# MongoDB on the server

How `po_mongo` is set up on the self-hosted box, and how it is backed up.
This is infrastructure, not application code — the compose file and backup
script live on the server, and this file is the record of what they contain
and why.

## The container

| | |
|---|---|
| Compose dir | `/home/ameya/docker/productionos-mongo` |
| Compose project | `productionos-mongo` |
| Container | `po_mongo` |
| Image | `mongo:8.0` |
| Command | `--replSet rs0 --bind_ip_all` |
| Published ports | **none** |
| Volumes | `mongo_data` → `/data/db`, `mongo_config` → `/data/configdb` |
| Networks | its own, plus the app's `productionos_default` (external) |
| Memory | ~112 MiB idle |

Its own compose project, so redeploying the app never recreates the database —
the same separation the Supabase stack uses.

### Why a replica set, not a standalone mongod

**Multi-document transactions only work on a replica set.** Two things depend
on them:

- `generateWorkflowTasks` writes a whole task list atomically, so a failure
  partway leaves nothing behind.
- `rotateRefreshToken` revokes the old session and issues the new one together,
  because a crash between the two would sign a user out silently.

A standalone `mongod` does not merely run these slower — it rejects them with
*"Transaction numbers are only allowed on a replica set member"*. A single-node
set is enough; no second node is needed for this.

### Why no published port

Nothing outside the Docker network talks to Mongo. The app resolves it as
`mongodb://po_mongo:27017/productionos?replicaSet=rs0` over the shared
`productionos_default` network, so there is no host port, no firewall rule and
no public hostname to get wrong. This is the opposite of the Supabase setup,
where PostgREST had to be published because browser code called it directly.

Verified: `po_app` reaches `po_mongo:27017`, and both containers are attached to
`productionos_default`.

### First boot

The replica set has to be initiated once. The healthcheck deliberately reports
healthy only when `rs.status().myState === 1`, so nothing starts against a set
that cannot accept writes.

```bash
cd /home/ameya/docker/productionos-mongo
docker compose -p productionos-mongo up -d

docker exec po_mongo mongosh --quiet --eval \
  'rs.initiate({_id:"rs0", members:[{_id:0, host:"po_mongo:27017"}]})'

# 1 = PRIMARY
docker exec po_mongo mongosh --quiet --eval 'rs.status().myState'
```

Transactions were verified on this instance directly, not only in tests:
a committed transaction inserted 2 documents, an aborted one left the count at
2, and the abort propagated. Re-run that check after any image upgrade.

## Seeding

```bash
MONGODB_URI='mongodb://po_mongo:27017/productionos?replicaSet=rs0' \
  node --experimental-strip-types scripts/seed-mongo.ts
```

Creates the indexes first, then upserts the 84 reference/demo rows by `_id`,
so it is idempotent and safe on every deploy. It deliberately seeds **no
production tasks** — those 11 demo rows are what collide with migration 027's
unique constraint.

## Backups

| | |
|---|---|
| Script | `/home/ameya/docker/productionos-mongo/backup.sh` |
| Cron | `30 22 * * *` (22:30 UTC = **04:00 IST**) |
| Destination | `/home/ameya/backups/productionos-mongo/` |
| Retention | 30 archives, rotation matches `productionos-mongo-*.tar.gz` only |
| Archive | `mongodump --archive --gzip --oplog` + the compose file, `chmod 600` |

Cron times are staggered so the three jobs never overlap: Postgres at 22:15,
Mongo at 22:30, Suwayomi at 22:45.

`--oplog` matters: it makes the snapshot point-in-time consistent *across*
collections, which a plain dump is not. The app writes multi-document
transactions, so a dump that caught one half of a transaction would restore to
a state the application never produced.

### It restore-tests itself every night

The script does not just write an archive and hope. Every run:

1. refuses to proceed unless `po_mongo` is **PRIMARY** (otherwise `mongodump`
   would fail or read a stale secondary),
2. checks the tar is readable,
3. **restores the dump into a scratch database** and compares document counts
   against live, failing the backup on any mismatch,
4. drops the scratch database.

A backup that cannot be restored is not a backup, and the only way to know is
to restore it.

### Manual restore

```bash
tar xzf /home/ameya/backups/productionos-mongo/productionos-mongo-<TS>.tar.gz -C /tmp/r
docker cp /tmp/r/mongo.archive.gz po_mongo:/tmp/restore.gz
docker exec po_mongo mongorestore --archive=/tmp/restore.gz --gzip --oplogReplay --drop
```

`--drop` replaces existing collections. Omit it to merge into what is there.

## Runbook

```bash
docker compose -p productionos-mongo ps
docker logs po_mongo --tail 50
docker exec po_mongo mongosh --quiet --eval 'rs.status().myState'            # 1
docker exec po_mongo mongosh --quiet productionos --eval 'db.getCollectionNames()'
docker exec po_mongo mongosh --quiet productionos --eval 'db.workflow_processes.countDocuments()'  # 60
/home/ameya/docker/productionos-mongo/backup.sh                              # on demand
tail -5 /home/ameya/backups/productionos-mongo/backup.log
```

## Not done here

The app still reads from Supabase. Pointing it at Mongo — `MONGODB_URI` in the
app's `.env`, the server-side read swap, the client components moving off
PostgREST, and retiring the `productionos-api` hostname — is the cutover, and
is deliberately out of scope for this phase.
