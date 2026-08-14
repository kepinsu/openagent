<!-- Context: root/navigation | Priority: critical | Version: 1.0 | Updated: 2026-08-12 -->

# OpenAgent Context Navigation

> Entry point for all context discovery. ContextScout starts here, then follows the areas relevant to the request.

## Discovery Order

1. `core/navigation.md` for orchestration, context-system, task-management, and handoff rules.
2. `project-intelligence/navigation.md` for business, technical, architectural, and decision context.
3. `standards/code.md` for Go coding conventions and validation expectations.
4. `mode/execution-modes.md` when local/provider mode affects scope, token budget, or retries.

## Context Areas

| Area | Path | Priority | Use When |
|------|------|----------|----------|
| Core system | `.opencode/context/core/navigation.md` | Critical | Understanding ContextScout, orchestration, task flow, and context lifecycle |
| Project intelligence | `.opencode/context/project-intelligence/navigation.md` | High | Understanding domain, architecture, decisions, and current notes |
| Standards | `.opencode/context/standards/code.md` | High | Planning or implementing Go code |
| Execution modes | `.opencode/context/mode/execution-modes.md` | Medium | Caller mentions local/provider mode, cost, token usage, or retry limits |

## Quick Routes

| Need | Start Here | Then Read |
|------|------------|-----------|
| Find context for a user request | `core/discovery/context-scout-job.md` | `core/discovery/context-scout-handoff.md` |
| Maintain or extend context structure | `core/context-system/navigation.md` | `core/context-system/catalog.md` |
| Plan implementation tasks | `core/task-management/navigation.md` | `core/task-management/task-schema.md` |
| Understand project purpose | `project-intelligence/navigation.md` | `business-domain.md`, `technical-domain.md` |
| Enforce Go style | `standards/code.md` | Relevant Go skills under `.opencode/skills/go/` |

## Rules For Consumers

- Follow navigation files before opening leaf files.
- Prefer verified paths over guessed paths.
- Keep context files and source references separate.
- Use ExternalScout only when internal context is insufficient for an external dependency.