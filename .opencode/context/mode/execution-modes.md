# Execution Modes

OpenAgent can run in two modes: `local` and `provider`.

The caller should explicitly tell agents which mode is active. If no mode is supplied, assume `local` because the default `.opencode/opencode.jsonc` is configured for LM Studio.

## Local Mode

Local mode is optimized for self-hosted models with a bounded context window. It treats context as a scarce resource rather than a cache for every agent transcript.

Behavior:

- Prefer task-specific context over broad project discovery.
- Pass compact handoffs and never raw scout, tool, or agent output to another agent.
- Keep implementation work to one narrow subtask per CoderAgent.
- Run TestEngineer and reviewer once, as the final quality gate for the completed feature.
- Use ExternalScout only when a precise, version-sensitive API detail is missing.
- Stop after one targeted retry instead of restarting discovery.

Recommended limits for a 70k-token model:

- subagent_depth: 3
- max_parallel_agents: 2
- max_retries_per_task: 1
- context_strategy: compact
- external_scout: on_demand
- share_raw_findings: false
- max_files_per_agent: 12
- max_context_tokens_per_agent: 60000

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

In provider mode, contextscout should return a compact project brief with:

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

In every mode, a supplied compact context overrides instructions such as "always call contextscout" or "always call ExternalScout". Call another scout only for one concrete missing item.
