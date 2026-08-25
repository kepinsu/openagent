<!-- Context: core/context-system/navigation | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Context System Navigation

> Maintains the internal knowledge tree consumed by contextscout and other agents.

## Files

| File | Purpose |
|------|---------|
| `catalog.md` | Inventory of active context areas and how they are used |

## Principles

- Navigation files are the source of truth for discovery.
- Context files should be small, focused, and easy to rank.
- Each file should have a single purpose.
- Prefer links and references over duplicating content.
- Store project-specific knowledge under `project-intelligence`.
- Store reusable workflow and schema knowledge under `core`.
- Store language standards under `standards` or language-specific skills.

## Maintenance Checklist

- Root navigation lists every top-level context area.
- Directory navigation lists every file in that directory.
- Broken references are either fixed or listed as known gaps.
- Deprecated context is moved or explicitly marked.
- New context files include purpose, priority, and update metadata.