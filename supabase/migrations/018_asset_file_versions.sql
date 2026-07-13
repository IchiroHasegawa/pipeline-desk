ALTER TABLE asset_files
    ADD COLUMN source_file_id UUID REFERENCES asset_files(id) ON DELETE CASCADE;

-- Backfill existing Source and Preview files with a version number if it's null
UPDATE asset_files
SET version_number = 1
WHERE file_role IN ('Source', 'Preview') AND version_number IS NULL;

-- Ensure no duplicate versions for the same source file
ALTER TABLE asset_files
    ADD CONSTRAINT asset_files_unique_version UNIQUE (source_file_id, version_number);

CREATE INDEX IF NOT EXISTS idx_asset_files_source_file_id ON asset_files(source_file_id);
