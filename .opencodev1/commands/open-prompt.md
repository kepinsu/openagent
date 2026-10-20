---
description: "Expand a brief request into a bounded OpenGoCoder prompt."
---

Turn the following lightweight user request into a clear, bounded prompt for
`OpenGoCoder`.

User request:

$ARGUMENTS

Preserve the user's intent. Do not inspect the repository, create a plan, write
files, invoke agents, or run commands. Do not invent implementation details,
file paths, subtasks, dependencies, phases, or validation commands.

If an essential product decision is genuinely missing, ask one concise
clarifying question. Otherwise state only narrow, explicit assumptions that
OpenGoCoder can validate through contextscout and task-manager.

Return only the following ready-to-paste prompt:

```md
You are OpenGoCoder.

## Objective
<concise restatement of the requested outcome>

## Scope
- <explicit requested behavior or deliverable>

## Out of Scope
- <only exclusions explicitly stated by the user, if any>

## Constraints
- <user-supplied constraints>
- Preserve existing architecture and conventions unless the user asks otherwise.

## Assumptions / Unknowns
- <only explicit, narrow assumptions or unknowns>

## Acceptance Criteria
- <observable outcomes requested by the user>

## Execution Mode
- <`local` or `provider` only when specified by the user; otherwise omit this section>

Use your normal orchestration workflow. Do not implement code directly.
Have task-manager create and validate the task artifacts before invoking
batch-executor. Pass the TaskManager artifact contract to batch-executor; do
not create an inline task contract or inline execution plan.
```

Never output subtask JSON, phase breakdowns, file lists, task IDs, or execution
steps as if they were TaskManager artifacts. Keep the expanded prompt concise.
