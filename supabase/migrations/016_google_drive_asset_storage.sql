CREATE TABLE asset_storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_drive')),
    root_folder_id TEXT NOT NULL,
    project_folder_id TEXT,
    category_folder_id TEXT,
    asset_folder_id TEXT NOT NULL,
    source_folder_id TEXT NOT NULL,
    preview_folder_id TEXT NOT NULL,
    versions_folder_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT asset_storage_locations_unique_asset_provider UNIQUE (asset_id, provider)
);

CREATE INDEX idx_asset_storage_locations_asset_id ON asset_storage_locations(asset_id);

ALTER TABLE asset_storage_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to asset storage locations" ON asset_storage_locations FOR ALL TO authenticated USING (true);


ALTER TABLE asset_files
    ADD COLUMN provider TEXT CHECK (provider IN ('google_drive')),
    ADD COLUMN drive_file_id TEXT UNIQUE,
    ADD COLUMN drive_parent_folder_id TEXT,
    ADD COLUMN original_file_name TEXT,
    ADD COLUMN extension TEXT,
    ADD COLUMN mime_type TEXT,
    ADD COLUMN file_role TEXT CHECK (file_role IN ('Source', 'Preview', 'Version')),
    ADD COLUMN version_number INTEGER,
    ADD COLUMN drive_created_time TIMESTAMPTZ,
    ADD COLUMN upload_status TEXT CHECK (upload_status IN ('Queued', 'Preparing', 'Uploading', 'Complete', 'Failed', 'Cancelled')),
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- file_size_bytes, file_name, file_url, file_format, created_at, asset_id already exist.
-- To ensure compatibility with older rows, we make new columns nullable, though application will enforce them for new uploads.

CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id_new ON asset_files(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_file_role ON asset_files(file_role);
