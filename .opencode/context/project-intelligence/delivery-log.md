<!-- Context: project-intelligence/delivery-log | Priority: high -->

# Delivery Log

> Verified feature outcomes recorded by DocWriter after each successful workflow.

## Latest Deliveries

Entries are added newest first.

## 2026-10-15 - opencode-v2-migration

- Delivered: Native V2 agents, ordered permissions, provider profiles and prompt
  routing plugin; `.opencodev1/` frozen for V1 symlink consumers with SHA-256
  manifest. Preserved pre-existing working-tree edits in the archive and migrated
  active definitions without staging or committing user work.
- Modules: `.opencode/agents/`, `plugins/`, `profiles/`, `skills/task-management/`,
  local review definitions, configuration templates, Git exclusions and README.
- Validation: 11 tests passed on Node 22.23.3, including native 2.0.29 schema
  decoding, permission order, router behavior, archive integrity and V1/V2
  symlink task workflows. Three archived router tests passed. Plugin typecheck
  passed. An isolated OpenCode 2.0.29 server discovered the active plugin, all
  22 custom agents, skills and `/open-prompt`. Dependency audit: zero findings.
- Follow-up: Real provider inference, personal MCP authentication and a full
  model-driven orchestration run were not exercised. oMLX body extensions and
  repetition-penalty support require validation against the deployed endpoint.
  A full V1 application startup remains machine/version-specific; archive tests
  exercise its JavaScript and task CLI, not a V1 binary.

## Entry Format

```markdown
## YYYY-MM-DD - feature-slug

- Delivered: [verified outcome]
- Modules: [affected modules or packages]
- Validation: [commands and result]
- Follow-up: [none | unresolved item]
```
