<!-- Context: core/task-management/guides/managing-tasks | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Managing Tasks

> Lifecycle rules for task-manager and batch-executor.

## State Flow

1. `pending`: task is planned and waiting.
2. `in_progress`: an agent has accepted the task.
3. `completed`: validation passed and task-manager accepted the result.
4. `blocked`: execution cannot continue without new information or external state.

## Status Rules

- Check current state before changing task files.
- Do not mark a task complete before validation.
- Do not run blocked tasks in parallel with dependent tasks.
- Preserve completion summaries under 200 characters.
- Archive only when every subtask is complete.

## Validation Rules

- Validate deliverables exist.
- Run the smallest meaningful test/build command for the changed area.
- Capture failures as actionable feedback for the next implementation attempt.
- Stop after retry limits from execution mode are reached.