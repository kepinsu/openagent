<!-- Context: core/context-system/catalog | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Context Catalog

> Active inventory of the context tree.

## Active Areas

| Area | Path | Owner Agent | Status | Notes |
|------|------|-------------|--------|-------|
| Root navigation | `.opencode/context/navigation.md` | ContextManager | Active | Entry point for ContextScout |
| Core discovery | `.opencode/context/core/discovery/` | ContextScout | Active | Job and handoff contract |
| Context system | `.opencode/context/core/context-system/` | ContextManager | Active | Catalog and maintenance rules |
| Task management | `.opencode/context/core/task-management/` | task-manager | Active | Task lifecycle and JSON schema |
| Project intelligence | `.opencode/context/project-intelligence/` | ContextManager | Active | Business and technical context |
| Standards | `.opencode/context/standards/` | OpenGoCoder | Active | Go code standards |
| Execution modes | `.opencode/context/mode/` | OpenGoCoder | Active | Local/provider behavior |

## Known Gaps

- Project intelligence files are templates and should be filled with real project facts as the repository evolves.
- Some existing files contain encoding artifacts from earlier revisions.
- The task-management agent references guide files that are not all present yet; `task-schema.md` now provides the minimal schema contract.

## Update Policy

- Update this catalog when adding, removing, renaming, or deprecating context areas.
- Keep status values simple: `Active`, `Deprecated`, `Archived`, or `Planned`.
- Do not list source files here; this catalog tracks context only.