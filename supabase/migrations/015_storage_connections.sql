CREATE TABLE storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('google_drive')),
    connection_name TEXT,
    account_label TEXT,
    encrypted_refresh_token TEXT NOT NULL,
    root_folder_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('Connected', 'Disconnected', 'Error')),
    last_connected_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE storage_connections ENABLE ROW LEVEL SECURITY;
-- No permissive policies added for anon or authenticated to enforce service_role only access
