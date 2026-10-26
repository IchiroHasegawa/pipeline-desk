-- Emits the full Postgres schema contract for schema `public` as a single JSON
-- document: the source of truth the Mongoose models are implemented against.
--
-- Run it against the Supabase Postgres and save the output:
--
--   psql -U postgres -d postgres -t -A -f scripts/extract-schema-contract.sql \
--     > docs/mongo-migration/schema-contract.json
--
-- or, for the self-hosted stack on tneuserver:
--
--   ssh ameya@<host> 'docker exec -i supabase-db psql -U postgres -d postgres -t -A -f -' \
--     < scripts/extract-schema-contract.sql > docs/mongo-migration/schema-contract.json
--
-- Why SQL rather than a Node script: no TypeScript runtime or driver is
-- needed, and the database renders the JSON itself, so anyone with a psql
-- connection reproduces the artifact byte-for-byte. Everything is ordered by
-- name so the committed file diffs cleanly when the schema changes.

WITH base_tables AS (
  SELECT c.oid, c.relname::text AS tbl
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
cols AS (
  SELECT
    c.table_name::text AS tbl,
    jsonb_object_agg(
      c.column_name,
      jsonb_build_object(
        'type', c.data_type,
        'nullable', (c.is_nullable = 'YES'),
        'default', c.column_default
      )
    ) AS j
  FROM information_schema.columns c
  JOIN base_tables b ON b.tbl = c.table_name
  WHERE c.table_schema = 'public'
  GROUP BY c.table_name
),
checks AS (
  SELECT b.tbl, jsonb_agg(def ORDER BY def) AS j
  FROM base_tables b
  JOIN (
    SELECT con.conrelid, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    WHERE con.contype = 'c'
  ) d ON d.conrelid = b.oid
  GROUP BY b.tbl
),
uniques AS (
  SELECT b.tbl, jsonb_agg(i.indexdef ORDER BY i.indexdef) AS j
  FROM base_tables b
  JOIN pg_indexes i ON i.tablename = b.tbl AND i.schemaname = 'public'
  WHERE i.indexdef LIKE '%UNIQUE%'
  GROUP BY b.tbl
),
fks AS (
  SELECT b.tbl, jsonb_agg(f.entry ORDER BY f.entry->>'column') AS j
  FROM base_tables b
  JOIN (
    SELECT
      con.conrelid,
      jsonb_build_object(
        'column',    att.attname,
        'refTable',  reft.relname,
        'refColumn', refatt.attname
      ) AS entry
    FROM pg_constraint con
    JOIN LATERAL unnest(con.conkey, con.confkey) AS k(local, remote) ON TRUE
    JOIN pg_attribute att    ON att.attrelid = con.conrelid AND att.attnum = k.local
    JOIN pg_class     reft   ON reft.oid = con.confrelid
    JOIN pg_attribute refatt ON refatt.attrelid = con.confrelid AND refatt.attnum = k.remote
    WHERE con.contype = 'f'
  ) f ON f.conrelid = b.oid
  GROUP BY b.tbl
)
SELECT jsonb_pretty(jsonb_build_object(
  'generatedFrom', 'public schema of the self-hosted Supabase Postgres',
  'tables', (
    SELECT jsonb_object_agg(b.tbl, jsonb_build_object(
      'columns',     COALESCE(c.j, '{}'::jsonb),
      'checks',      COALESCE(ck.j, '[]'::jsonb),
      'uniques',     COALESCE(u.j, '[]'::jsonb),
      'foreignKeys', COALESCE(fk.j, '[]'::jsonb)
    ))
    FROM base_tables b
    LEFT JOIN cols    c  ON c.tbl  = b.tbl
    LEFT JOIN checks  ck ON ck.tbl = b.tbl
    LEFT JOIN uniques u  ON u.tbl  = b.tbl
    LEFT JOIN fks     fk ON fk.tbl = b.tbl
  ),
  'views', (
    SELECT jsonb_agg(table_name::text ORDER BY table_name)
    FROM information_schema.views WHERE table_schema = 'public'
  )
));
