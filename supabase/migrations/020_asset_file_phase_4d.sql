-- Phase 4D Asset File Versioning and Lifecycle Updates

-- 1. Add current_file_id, display_name, and restored_from_file_id
ALTER TABLE asset_files
    ADD COLUMN current_file_id UUID REFERENCES asset_files(id) ON DELETE SET NULL,
    ADD COLUMN display_name VARCHAR(200),
    ADD COLUMN restored_from_file_id UUID REFERENCES asset_files(id) ON DELETE SET NULL;

-- 2. Rename upload_status to record_status
ALTER TABLE asset_files
    RENAME COLUMN upload_status TO record_status;

-- 3. Temporarily drop the old check constraint
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'asset_files'::regclass AND conname = 'asset_files_upload_status_check'
    ) LOOP
        EXECUTE 'ALTER TABLE asset_files DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 4. Map 'Complete' to 'Active'
UPDATE asset_files
SET record_status = 'Active'
WHERE record_status = 'Complete';

-- 5. Add the new record_status check constraint
ALTER TABLE asset_files
    ADD CONSTRAINT asset_files_record_status_check 
    CHECK (record_status IN ('Queued', 'Preparing', 'Uploading', 'Active', 'Retired', 'Trashed', 'Failed', 'Cancelled', 'Missing'));

-- 6. Backfill existing Source files to be their own current_file_id
UPDATE asset_files
SET current_file_id = id
WHERE file_role = 'Source' AND current_file_id IS NULL;

-- 7. Ensure that only 'Source' files hold the current_file_id property
ALTER TABLE asset_files
    ADD CONSTRAINT asset_files_current_file_id_check
    CHECK (
        (file_role = 'Source') OR (current_file_id IS NULL)
    );
