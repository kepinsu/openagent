# Execution Modes

OpenAgent can run in two modes: `local` and `provider`.

The caller should explicitly tell agents which mode is active. If no mode is supplied, assume `local` because the default `.opencode/opencode.jsonc` is configured for LM Studio.

## Local Mode

Local mode is optimized for local models, self-hosted inference and experiments where token cost is secondary.

Behavior:

- Prefer autonomy and throughput.
- Allow broad project discovery.
- Allow rich context handoff between agents.
- Allow more parallel implementation agents.
- Allow ExternalScout when it may improve correctness.
- Allow more retries before stopping.

Recommended limits:

- `subagent_depth`: 10
- `max_parallel_agents`: 4
- `max_retries_per_task`: 3
- `context_strategy`: `broad`
- `external_scout`: `auto`
- `share_raw_findings`: true
- `max_files_per_agent`: 30

## Provider Mode

Provider mode is optimized for hosted providers, paid APIs and subscription quotas.

Behavior:

- Prefer cost control and predictable token usage.
- Use a compact project brief instead of repeated full context discovery.
- Do not pass full transcripts or raw file dumps to subagents.
- Limit parallel calls.
- Use ExternalScout only when docs are missing, version-sensitive or explicitly required.
- Cap retries and stop repeated failures early.
- Use cheaper or balanced models for scouting, planning and documentation when possible.
- Reserve stronger models for coding and difficult validation failures.

Recommended limits:

- `subagent_depth`: 3
- `max_parallel_agents`: 2
- `max_retries_per_task`: 1
- `context_strategy`: `compact`
- `external_scout`: `on_demand`
- `share_raw_findings`: false
- `max_files_per_agent`: 8
- `max_context_tokens_per_agent`: 12000

## Compact Context Contract

In provider mode, ContextScout should return a compact project brief with:

- relevant architecture;
- coding conventions;
- testing strategy;
- file map with short descriptions;
- implementation constraints;
- explicit unknowns;
- ExternalScout recommendation only when internal context is insufficient.

TaskManager should pass bounded context to each subtask:

- task name;
- files likely to change;
- standards required for that task;
- source references required for that task;
- acceptance criteria;
- validation command;
- estimated complexity.

Each implementation agent should receive only:

- original user request;
- compact project brief;
- its own subtask JSON;
- task-specific context files;
- task-specific reference files;
- latest validation feedback when retrying.

## Mode-Specific Conflict Rules

When local and provider rules conflict:

- local mode favors richer context and more autonomy;
- provider mode favors fewer calls, smaller prompts and explicit stopping conditions.

Provider mode always overrides instructions such as "always call ContextScout" or "always call ExternalScout" when an equivalent compact context or fresh cached documentation is already supplied.
