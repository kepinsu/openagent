<!-- Context: core/task-management/guides/splitting-tasks | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Splitting Tasks

> Guidance for turning a user request into small, verifiable implementation tasks.

## Good Subtasks

A good subtask has:

- one objective;
- clear deliverables;
- explicit dependencies;
- bounded context files;
- bounded reference files;
- binary acceptance criteria;
- a validation path.

## Split By

- Package or module boundary.
- Interface or contract boundary.
- Data model before behavior that depends on it.
- Implementation before validation only when tests require the implementation to exist.
- Documentation after successful implementation.

## Keep Together

Keep work in the same subtask when splitting would create fragile partial states, such as changing a small interface and its only implementation.

## Parallel Criteria

Mark `parallel: true` only when tasks do not modify the same files, do not depend on each other's contracts, and can be validated independently.