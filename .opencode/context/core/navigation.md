<!-- Context: core/navigation | Priority: critical | Version: 1.0 | Updated: 2026-08-12 -->

# Core Context

> Core operating knowledge for OpenAgent's multi-agent workflow.

## Structure

```
.opencode/context/core/
|-- navigation.md
|-- discovery/
|   |-- context-scout-job.md
|   `-- context-scout-handoff.md
|-- context-system/
|   |-- navigation.md
|   `-- catalog.md
`-- task-management/
    |-- navigation.md
    `-- task-schema.md
```

## Routes

| Need | File | Priority |
|------|------|----------|
| Run contextscout correctly | `discovery/context-scout-job.md` | Critical |
| Format contextscout output | `discovery/context-scout-handoff.md` | Critical |
| Understand context inventory | `context-system/catalog.md` | High |
| Maintain context navigation | `context-system/navigation.md` | High |
| Create implementation task JSON | `task-management/task-schema.md` | High |
| Understand task lifecycle | `task-management/navigation.md` | High |

## Integration

- `OpenGoCoder` invokes `contextscout` before task planning.
- `task-manager` consumes contextscout handoff as `context_files` and `reference_files`.
- `batch-executor` passes bounded context to implementation agents.
- `ContextManager` maintains this tree when the context system changes.