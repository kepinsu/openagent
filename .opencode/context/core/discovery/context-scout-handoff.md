<!-- Context: core/discovery/context-scout-handoff | Priority: critical | Version: 1.0 | Updated: 2026-08-12 -->

# ContextScout Handoff

> Output contract used by OpenGoCoder, task-manager, and batch-executor.

## Required Shape

```markdown
# ContextScout Handoff

## Request Understanding
- intent: ...
- tracks: [...]
- execution_mode: local | provider | unknown

## Critical Context Files
- path: `.opencode/context/...`
  reason: ...
  contains: ...

## High Priority Context Files
- path: `.opencode/context/...`
  reason: ...
  contains: ...

## Medium Priority Context Files
- path: `.opencode/context/...`
  reason: ...
  contains: ...

## Reference Files
- path: `...`
  reason: ...
  contains: ...

## ExternalScout Recommendation
- needed: true | false
- library_or_framework: ...
- reason: ...
- suggested_prompt: ...

## Gaps And Unknowns
- ...

## Loading Advice
- for_task_manager:
  - context_files: [...]
  - reference_files: [...]
- for_batch_executor:
  - pass compact brief: true | false
  - max_files_per_agent: ...
```

## Field Rules

- `context_files` are standards, policies, process docs, architecture notes, and project knowledge.
- `reference_files` are source code, tests, configs, examples, or task artifacts.
- `ExternalScout Recommendation` is always present, even when `needed: false`.
- `Gaps And Unknowns` is always present. Use `none` when there are no known gaps.
- Keep paths relative to the repository root.

## Consumer Rules

TaskManager:

- Use `context_files` for standards and constraints.
- Use `reference_files` for implementation examples and source material.
- Do not copy all ContextScout output into every subtask. Narrow context per task.

BatchExecutor:

- Pass only task-specific context to each implementation agent.
- In provider mode, honor `max_files_per_agent`.
- Re-run ContextScout for a task only when a subtask lacks enough context or validation reveals a hidden dependency.

OpenGoCoder:

- Treat this handoff as discovery, not a plan.
- Invoke ExternalScout when recommended and the implementation depends on that dependency.