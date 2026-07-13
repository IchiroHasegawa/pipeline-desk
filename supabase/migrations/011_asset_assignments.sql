CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    environment_id UUID REFERENCES production_environments(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_assignment_target CHECK (
        (project_id IS NOT NULL AND environment_id IS NULL AND episode_id IS NULL AND scene_id IS NULL) OR
        (project_id IS NULL AND environment_id IS NOT NULL AND episode_id IS NULL AND scene_id IS NULL) OR
        (project_id IS NULL AND environment_id IS NULL AND episode_id IS NOT NULL AND scene_id IS NULL) OR
        (project_id IS NULL AND environment_id IS NULL AND episode_id IS NULL AND scene_id IS NOT NULL)
    )
);

ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to asset assignments" ON asset_assignments FOR ALL TO authenticated USING (true);
