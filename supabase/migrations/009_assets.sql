CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_name TEXT NOT NULL,
    asset_code TEXT NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 4,
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    asset_type TEXT NOT NULL,
    workflow TEXT,
    tags TEXT[] DEFAULT '{}',
    preview_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to assets" ON assets FOR ALL TO authenticated USING (true);
