# Production OS Project Handoff

## Product Name

The application is now named:

Production OS

Previous working names such as:

- AssetStage
- PipelineDesk

are deprecated.

Use Production OS in new visible UI text, documentation, page metadata, and future development.

Do not rename internal folders, Git repositories, database tables, environment variables, or existing identifiers solely for branding unless explicitly requested.

## Project Purpose

Production OS is a production and asset tracking web application for:

- 2D animation
- 3D animation
- short-form production
- long-form production
- live-action production
- hybrid productions
- multiple concurrent projects

Planned capabilities include:

- production tracking
- episode tracking
- scene tracking
- task tracking
- asset tracking
- task assignment
- team communication
- notes
- annotations
- review workflows
- approval workflows
- team management
- user roles
- group permissions
- production access control

## Technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase JavaScript client
- Supabase SSR
- Git
- GitHub

## Approved Design

The current Production page was designed using Google Stitch.

The existing visual design is approved.

Do not redesign these areas unless explicitly requested:

- top navigation
- environment toolbar
- episode selector
- production table
- scene table
- progress indicators
- right details panel
- bottom task panel
- colors
- typography
- spacing
- general dashboard layout

Preserve the current dark professional studio-pipeline design.

## Application Data Structure

Production Environment

→ Episode

→ Scene

→ Production Task

→ Scene Notes

## Current Supabase Work

Phase 3A was implemented.

Existing backend files may include:

- lib/supabase/client.ts
- lib/data/productionRepository.ts
- types/supabase.ts
- supabase/migrations/001_initial_production_schema.sql
- supabase/migrations/002_development_access_policies.sql

Inspect the repository before assuming which later phases are complete.

The database includes or is planned to include:

- production_environments
- episodes
- scenes
- production_tasks
- scene_notes

Row Level Security is enabled.

The policies in:

supabase/migrations/002_development_access_policies.sql

are temporary development policies.

They must be replaced before public deployment.

## Supabase Security

The project may use:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Never print, expose, copy, or commit real environment-variable values.

Never use a Supabase service-role key in browser code.

## Development Rules

- Inspect relevant files before editing.
- Read AGENTS.md.
- Read PROJECT_HANDOFF.md.
- Preserve the approved Stitch design.
- Keep TypeScript strict.
- Do not use any.
- Do not install another UI framework without approval.
- Do not rewrite unrelated files.
- Do not remove working features.
- Keep mockProductions.ts until its removal is explicitly approved.
- Do not silently fall back to mock data.
- Do not expose credentials.
- Do not add authentication unless requested.
- Do not add team roles unless requested.
- Do not add Storage unless requested.
- Do not add Realtime unless requested.
- Do not add review or approval workflows unless requested.
- Make small, reviewable changes.
- Run lint and build after major implementation work.

## Validation Commands

Development:

npm run dev

Lint:

npm run lint

Production build:

npm run build

## Definition of Complete

Work is complete only when:

- requested functionality works
- current functionality still works
- approved design is preserved
- TypeScript passes
- lint passes
- production build succeeds
- changed files are reported
- browser testing instructions are provided
