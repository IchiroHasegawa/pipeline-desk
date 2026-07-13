DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'asset_files'::regclass AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE asset_files DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

ALTER TABLE asset_files
    ADD CONSTRAINT asset_files_provider_check CHECK (provider IN ('google_drive')),
    ADD CONSTRAINT asset_files_file_role_check CHECK (file_role IN ('Source', 'Preview', 'Version', 'Versions')),
    ADD CONSTRAINT asset_files_upload_status_check CHECK (upload_status IN ('Queued', 'Preparing', 'Uploading', 'Complete', 'Failed', 'Cancelled', 'Missing'));
