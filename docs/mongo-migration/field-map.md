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
