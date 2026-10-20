<!-- Context: core/discovery/context-scout-job | Priority: critical | Version: 1.0 | Updated: 2026-08-12 -->

# contextscout Job

> Defines the discovery job performed before task planning and implementation.

## Purpose

contextscout prevents agents from coding with stale or guessed assumptions. It builds a verified, ranked map of the internal knowledge needed for a user request.

## Inputs

- Original user request.
- Optional execution mode: `local` or `provider`.
- Optional target area, feature name, package name, or files mentioned by the caller.
- Optional previous task state when resuming.

## Outputs

- Ranked context files.
- Relevant source reference files.
- ExternalScout recommendation when internal context is insufficient.
- Gaps and unknowns that planning must account for.
- Loading advice for task-manager and batch-executor.

## Mandatory Steps

1. Resolve `.opencode/paths.json`.
2. Read `.opencode/context/navigation.md`.
3. Follow relevant navigation files.
4. Search context for request terms.
5. Verify every recommended path.
6. Separate standards from source references.
7. Rank recommendations.
8. Return the handoff format from `context-scout-handoff.md`.

## Discovery Tracks

| Track | Trigger | Typical Files |
|-------|---------|---------------|
| `project_brief` | Broad or unclear request | `project-intelligence/*.md` |
| `architecture` | Structure, boundaries, refactoring | `technical-domain.md`, `decisions-log.md` |
| `standards` | Any implementation request | `standards/code.md`, relevant Go skills |
| `task_planning` | Feature breakdown or execution | `core/task-management/*.md` |
| `context_system` | Context creation or maintenance | `core/context-system/*.md` |
| `external_dependency` | Library, framework, SDK, API | Internal context first, then ExternalScout |

## Ranking Guidance

Critical:

- Required to avoid wrong architecture or invalid workflow.
- Required by an orchestrator invariant.
- Required for task schema, context root, or code standards.

High:

- Strongly informs design choices or validation.
- Explains current architecture or active decisions.
- Gives conventions the implementation should follow.

Medium:

- Helpful background.
- Optional historical context.
- Broad documentation that may be useful later.

## Hard Rules

- Do not write files.
- Do not run commands.
- Do not fetch external docs.
- Do not call other agents.
- Do not recommend unverified paths.
- Do not dump every file just because it exists.