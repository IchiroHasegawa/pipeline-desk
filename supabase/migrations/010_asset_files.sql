CREATE TABLE asset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_format TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to asset files" ON asset_files FOR ALL TO authenticated USING (true);
