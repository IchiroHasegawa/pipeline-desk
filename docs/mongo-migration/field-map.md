# Postgres → Mongo field map

The Postgres schema is snake_case; the Mongo models are camelCase. Every
rename is listed here, because the cutover has to rewrite roughly 215
`.from(...)` call sites and needs one authoritative mapping.

Only renames and structural changes are listed. A column whose name is already
camel-safe and unchanged (`title`, `status`, `description`, `priority`,
`content`, `code`, `workflow`) is not repeated.

Source of truth for types and constraints: `schema-contract.json`.

## Collections

| Postgres table | Mongo collection | Model |
|---|---|---|
| `auth.users` + `public.profiles` | `profiles` | `Profile` |
| — (new) | `sessions` | `Session` |
| — (new) | `password_reset_tokens` | `PasswordResetToken` |
| `projects` | `projects` | `Project` |
| `episodes` | `episodes` | `Episode` |
| `scenes` | `scenes` | `Scene` |
| `days` | `days` | `Day` |
| `scene_notes` | `scene_notes` | `SceneNote` |

## profiles

`auth.users` and `public.profiles` are **merged**. With GoTrue gone there is no
second table to join on, so identity and profile live together.

| Postgres | Mongo | Note |
|---|---|---|
| `profiles.id` | `_id` | UUID string, not ObjectId |
| `auth.users.email` | `email` | moved here; lowercased, unique (case-insensitive) |
| `auth.users.encrypted_password` | `passwordHash` | bcrypt; `select: false` + stripped in `toJSON` |
| `profiles.username` | `username` | **casing preserved**; unique via collation index, matching Postgres' `lower(username)` index |
| `profiles.display_name` | `displayName` | |
| `profiles.avatar_url` | `avatarUrl` | |
| `profiles.account_status` | `accountStatus` | `active`\|`suspended`\|`disabled`, default `active` |
| `profiles.system_role` | `systemRole` | `user`\|`owner`, default `user` |
| `created_at` / `updated_at` | `createdAt` / `updatedAt` | Mongoose `timestamps: true` |

Dropped: the `profiles.id → auth.users.id` foreign key (no `auth.users`).

## projects

| Postgres | Mongo |
|---|---|
| `project_code` | `projectCode` |
| `thumbnail_url` | `thumbnailUrl` |
| `start_date` / `end_date` | `startDate` / `endDate` |
| `is_system` | `isSystem` |
| `default_asset_workflow_id` | `defaultAssetWorkflowId` |
| `asset_code_prefix` | `assetCodePrefix` |
| `board_layout` | `boardLayout` (Mixed, default `{}`) |

`UNIQUE INDEX projects_single_system_idx ON ((true)) WHERE is_system` becomes a
**partial unique index** on `{ isSystem: 1 }` filtered to `isSystem: true`.
Without the partial filter every non-system project would collide on `false`.

**There is no board-views field.** Migration `037_project_board_views.sql` is
misleadingly named — it creates the three database views, not a column.

## episodes

| Postgres | Mongo |
|---|---|
| `project_id` | `projectId` |
| `episode_name` | `episodeName` |
| `start_date` / `end_date` | `startDate` / `endDate` |
| `sort_order` | `sortOrder` |
| `preview_image` | `previewImage` |
| `job_workflow` | `jobWorkflow` (free text, not a ref) |
| `scene_workflow` | `sceneWorkflow` (free text, not a ref) |

## scenes

| Postgres | Mongo |
|---|---|
| `episode_id` | `episodeId` |
| `scene_name` | `sceneName` |
| `number_of_frames` | `numberOfFrames` (min 1) |
| `sort_order` | `sortOrder` |
| `preview_image` | `previewImage` |

## days

| Postgres | Mongo |
|---|---|
| `episode_id` | `episodeId` |
| `day_date` | `dayDate` |
| `sort_order` | `sortOrder` |

## scene_notes

| Postgres | Mongo |
|---|---|
| `scene_id` | `sceneId` |

## assets

| Postgres | Mongo |
|---|---|
| `asset_code` | `assetCode` (NOT NULL but **not** unique) |
| `asset_name` | `assetName` |
| `asset_type` | `assetType` |
| `asset_number` | `assetNumber` |
| `category_id` | `categoryId` |
| `preview_url` | `previewUrl` |
| `sort_order` | `sortOrder` |

`asset_number` came from a Postgres **sequence** (`nextval`). Mongo has no
sequences: the repository layer assigns the value, and the model enforces
uniqueness with a **partial** index (the column is nullable, so a plain unique
index would reject every second numberless asset).

`assets` has **no CHECK constraints** — unlike projects/episodes/scenes its
`status` is free text.

## asset_files

The plan was wrong about this table in two ways; the contract is authoritative.

| Postgres | Mongo |
|---|---|
| `file_url` / `file_name` / `file_format` | `fileUrl` / `fileName` / `fileFormat` |
| `display_name` / `original_file_name` | `displayName` / `originalFileName` |
| `mime_type` | `mimeType` |
| `file_size_bytes` | `fileSizeBytes` (default 0) |
| `file_role` | `fileRole` — **four** values: `Source`, `Preview`, `Version`, `Versions` |
| `record_status` | `recordStatus` — **not** `uploadStatus`: `Queued`, `Preparing`, `Uploading`, `Active`, `Retired`, `Trashed`, `Failed`, `Cancelled`, `Missing` |
| `drive_file_id` / `drive_parent_folder_id` / `drive_created_time` | `driveFileId` / `driveParentFolderId` / `driveCreatedTime` |
| `version_number` | `versionNumber` |
| `source_file_id` / `current_file_id` / `restored_from_file_id` | `sourceFileId` / `currentFileId` / `restoredFromFileId` |

There is **no `upload_status` column** and no `Complete` status.

Two partial unique indexes, both because the columns are nullable:
`driveFileId`, and `(sourceFileId, versionNumber)`.

`CHECK ((file_role = 'Source') OR (current_file_id IS NULL))` becomes a path
validator: `currentFileId` may only be set on a `Source` file.

## asset_categories · asset_storage_locations · storage_connections

| Postgres | Mongo |
|---|---|
| `asset_categories.sort_order` | `sortOrder` (name is unique) |
| `asset_storage_locations.*_folder_id` | `rootFolderId`, `assetFolderId`, `sourceFolderId`, `previewFolderId`, `versionsFolderId` (all required), `projectFolderId`, `categoryFolderId` (optional) |
| `storage_connections.encrypted_refresh_token` | `encryptedRefreshToken` — `select: false` + stripped in `toJSON` |
| `storage_connections.connection_name` / `account_label` | `connectionName` / `accountLabel` |
| `storage_connections.last_connected_at` / `last_error` | `lastConnectedAt` / `lastError` |

`asset_storage_locations` keeps `UNIQUE (assetId, provider)`, which is what
lets one asset live in several providers — the seam the Cloudinary phase uses.

## asset_assignments

| Postgres | Mongo |
|---|---|
| `asset_id` / `project_id` / `episode_id` / `scene_id` | `assetId` / `projectId` / `episodeId` / `sceneId` |

The three-branch CHECK enforcing **exactly one** of project/episode/scene
becomes a `pre("validate")` hook.

## link collections

| Postgres | Mongo | Unique on |
|---|---|---|
| `asset_project_links` | `asset_project_links` | `(assetId, projectId)` |
| `asset_scene_links` | `asset_scene_links` | `(assetId, sceneId)` |
| `asset_job_links` | `asset_job_links` | `(assetId, episodeId)` — "job" is an episode |

Kept as collections, not embedded arrays: the relationships are many-to-many
and queried from both directions, so embedding would duplicate and drift.
