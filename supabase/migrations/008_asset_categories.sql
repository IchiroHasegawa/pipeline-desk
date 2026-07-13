CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to select asset categories" ON asset_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert asset categories" ON asset_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update asset categories" ON asset_categories FOR UPDATE TO authenticated USING (true);
