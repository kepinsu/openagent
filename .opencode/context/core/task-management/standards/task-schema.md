<!-- Context: core/task-management/standards/task-schema | Priority: high | Version: 1.0 | Updated: 2026-08-12 -->

# Task Schema

> JSON schema contract for OpenAgent task planning.

## Feature Task

Create one `task.json` per feature:

```json
{
  "id": "feature-slug",
  "name": "Feature Name",
  "status": "active",
  "objective": "One-line objective under 200 characters",
  "context_files": [".opencode/context/standards/code.md"],
  "reference_files": ["path/to/source.go"],
  "exit_criteria": ["All tests pass"],
  "subtask_count": 1,
  "completed_count": 0,
  "created_at": "2026-08-12T00:00:00Z"
}
```

## Subtask

Create one `subtask_NN.json` per implementation unit:

```json
{
  "id": "feature-slug-01",
  "seq": "01",
  "title": "Implement focused behavior",
  "status": "pending",
  "depends_on": [],
  "parallel": false,
  "suggested_agent": "CoderAgent",
  "context_files": [".opencode/context/standards/code.md"],
  "reference_files": ["path/to/source.go"],
  "acceptance_criteria": ["Behavior is implemented", "Relevant tests pass"],
  "deliverables": ["path/to/source.go", "path/to/source_test.go"]
}
```

## Status Values

- `pending`: ready when dependencies are complete.
- `in_progress`: assigned to an agent.
- `completed`: validated and accepted.
- `blocked`: cannot proceed without new information or external change.

## Context Boundary

- `context_files`: standards, architecture, process, domain knowledge.
- `reference_files`: code, tests, configs, fixtures, generated artifacts.
- Large files may use objects with `path`, `lines`, and `reason`.

Example:

```json
{
  "path": ".opencode/context/standards/code.md",
  "lines": "1-80",
  "reason": "Go naming and file organization rules"
}
```

## Validation Expectations

Each task should define:

- exact deliverables;
- relevant tests or build commands;
- acceptance criteria that can pass or fail;
- dependencies needed before execution;
- whether it can safely run in parallel.