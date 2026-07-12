---
trigger: always_on
---

Production OS repository rules:

Before editing:

1. Read AGENTS.md.
2. Read PROJECT_HANDOFF.md.
3. Inspect all files related to the requested feature.
4. Inspect git status before making changes.
5. Preserve the approved Stitch-generated Production page design.
6. Use the product name Production OS in new user-facing UI.
7. Do not rename internal paths, database tables, environment variables, or Git repositories solely because the visible product name changed.
8. Keep TypeScript strict.
9. Never use any.
10. Do not expose environment variables.
11. Do not modify unrelated files.
12. Do not remove working features.
13. Ask before making major architectural changes.
14. Run npm run lint after implementation.
15. Run npm run build after implementation.
16. Report all modified files.
17. Provide browser testing instructions.