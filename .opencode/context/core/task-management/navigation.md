<!-- Context: core/task-management/navigation | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Task Management Context

> Minimal context required for task-manager to transform a request into implementation-ready JSON tasks.

## Files

| File | Purpose |
|------|---------|
| `standards/task-schema.md` | Canonical task and subtask JSON contract |
| `guides/splitting-tasks.md` | How to split work into atomic subtasks |
| `guides/managing-tasks.md` | Task lifecycle, status updates, and validation flow |

## Lifecycle

1. contextscout discovers relevant context and references.
2. task-manager creates `.tmp/tasks/{feature}/task.json`.
3. task-manager creates one `subtask_NN.json` file per atomic unit.
4. batch-executor assigns runnable subtasks to implementation agents.
5. TestEngineer validates each completed subtask.
6. task-manager marks subtasks complete only after validation.
7. Completed features are archived under `.tmp/tasks/completed/{feature}/`.

## Planning Rules

- Tasks must be atomic and verifiable.
- Dependencies must be explicit.
- Parallel work is allowed only when files, contracts, and side effects do not conflict.
- Context files and source reference files must stay separate.
- Acceptance criteria must be binary enough for validation.
- Provider mode should keep tasks smaller and context narrower.