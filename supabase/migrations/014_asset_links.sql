CREATE TABLE asset_project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT asset_project_links_unique UNIQUE (asset_id, project_id)
);

CREATE INDEX idx_asset_project_links_asset_id ON asset_project_links(asset_id);
CREATE INDEX idx_asset_project_links_project_id ON asset_project_links(project_id);

ALTER TABLE asset_project_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to asset_project_links" ON asset_project_links FOR ALL TO authenticated USING (true);


CREATE TABLE asset_environment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES production_environments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT asset_environment_links_unique UNIQUE (asset_id, environment_id)
);

CREATE INDEX idx_asset_environment_links_asset_id ON asset_environment_links(asset_id);
CREATE INDEX idx_asset_environment_links_env_id ON asset_environment_links(environment_id);

ALTER TABLE asset_environment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to asset_environment_links" ON asset_environment_links FOR ALL TO authenticated USING (true);


CREATE TABLE asset_job_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT asset_job_links_unique UNIQUE (asset_id, episode_id)
);

CREATE INDEX idx_asset_job_links_asset_id ON asset_job_links(asset_id);
CREATE INDEX idx_asset_job_links_episode_id ON asset_job_links(episode_id);

ALTER TABLE asset_job_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to asset_job_links" ON asset_job_links FOR ALL TO authenticated USING (true);


CREATE TABLE asset_scene_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT asset_scene_links_unique UNIQUE (asset_id, scene_id)
);

CREATE INDEX idx_asset_scene_links_asset_id ON asset_scene_links(asset_id);
CREATE INDEX idx_asset_scene_links_scene_id ON asset_scene_links(scene_id);

ALTER TABLE asset_scene_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to asset_scene_links" ON asset_scene_links FOR ALL TO authenticated USING (true);
