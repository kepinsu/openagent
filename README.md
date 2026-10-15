# OpenAgent

OpenCode configuration for a bounded multi-agent workflow: Go development,
focused frontend design, product work, merge-request review, and project
knowledge maintenance.

OpenAgent was initially inspired by
[OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl) and uses
the Go skills from [cc-skills-golang](https://github.com/samber/cc-skills-golang).
Its agents and execution rules are maintained locally in this repository.

## Installation: OpenCode V2

The active `.opencode/` tree targets **OpenCode 2.0.29** and the matching
`@opencode/plugin` API. Use **Node.js 22.19 or newer** for dependency installation
and the validation suite.

```sh
npm ci --prefix .opencode
npm test --prefix .opencode
npm run check --prefix .opencode
```

With OpenCode on `PATH` and Python 3 installed, run the optional clean-runtime
discovery check with `npm run test:runtime --prefix .opencode`. It starts and stops
its own authenticated server, checks plugin/agent/skill/command discovery, and
does not submit prompts or load your personal configuration.

For another project, link its `.opencode` to this repository's `.opencode`
directory (only when the destination does not already exist):

```sh
ln -s /absolute/path/to/openagent/.opencode /path/to/project/.opencode
```

Copy `.opencode/opencode.example.jsonc` to `.opencode/opencode.jsonc` only for a
fresh setup; merge it into an existing configuration instead of overwriting it.
The runtime config is ignored by Git and may contain personal provider/MCP
settings. A directory symlink shares that runtime config across consumers; use
separate copies or global settings when machines/projects need different values.
Use environment substitutions such as `{env:GITLAB_TOKEN}` for credentials.

Agents, commands, skills and the local router plugin are discovered automatically.
The example selects `core/opencoder-go` and a subagent depth of 3. Select that
agent explicitly when using an existing session.

## Machines still on V1

`.opencodev1/` is a frozen pre-migration archive, including the V1 router and its
dependency lockfile. On a V1 machine, point the consuming project's `.opencode`
symlink at **`.opencodev1/`**, not at `.opencode/`:

```sh
ln -s /absolute/path/to/openagent/.opencodev1 /path/to/project/.opencode
```

Keep the existing paths inside the archive: they resolve through the `.opencode`
link. See [.opencodev1/README.md](.opencodev1/README.md) for snapshot provenance,
private configuration and compatibility details. The archive is not maintained
in parallel with V2.

## Scope

- Go is the only production-code specialization currently configured.
- Frontend work is limited to focused HTML/CSS designs in design_iterations/.
  The frontend specialist does not edit JavaScript, TypeScript, backend code,
  secrets, or environment files.
- Product work and merge-request reviews are separate primary-agent workflows.
  They are not development-router targets.

## Choose the right entry point

| Need | Select or run | Result |
| --- | --- | --- |
| Go development | OpenGoCoder | Development entry point; the router gives task-manager an implementation-route hint. |
| Frontend design | OpenGoCoder with a clear UI request | Full orchestration, then open-frontend-specialist for the relevant implementation subtask. |
| Context bootstrap or extension | system-builder | Delegates verified context work to context-organizer. |
| Merge or pull request review | MergeRequestReviewer | Read-only review workflow; it is never auto-selected. |
| Product story, issue, or product documentation | ProductOwner | Product workflow; it is never auto-selected. |
| Turn a short request into an OpenGoCoder prompt | /open-prompt request | Returns a bounded prompt only; it does not implement anything. |

## OpenCode 2 agent names

OpenCode 2 registers nested agents by their path relative to the agent
directory, without the Markdown extension. Use these exact identifiers when
selecting agents, calling the subagent tool, or setting delegation permissions:

| Role | OpenCode 2 identifier |
| --- | --- |
| OpenGoCoder | `core/opencoder-go` |
| ContextScout | `subagents/core/contextscout` |
| ExternalScout | `subagents/core/externalscout` |
| TaskManager | `subagents/core/task-manager` |
| batch-executor | `subagents/core/batch-executor` |
| CoderAgent | `subagents/code/coder-agent` |
| Frontend specialist | `subagents/code/open-frontend-specialist` |
| TestEngineer | `subagents/code/test-engineer` |
| reviewer | `subagents/code/reviewer` |
| docwriter | `subagents/core/documentation` |
| MergeRequestReviewer | `core/merge-request-reviewer` |
| ProductOwner | `core/product-owner` |
| system-builder | `core/system-builder` |

For example, call `subagent(agent="subagents/core/contextscout", ...)`.
`ContextScout` is a role label, not a registered subagent identifier. Built-in
`explore` keeps its built-in name. The shorter names elsewhere in this README
refer to roles; the table above gives their executable identifiers.

After deploying these configuration changes, restart OpenCode and start a new
session with `core/opencoder-go` so the old prompts are not reused. Existing
TaskManager artifacts may still contain short `suggested_agent` values;
batch-executor maps the supported legacy implementation names before dispatch.

Validate native V2 configuration, agent references, the routing plugin and archive
integrity with `npm test --prefix .opencode`. Check the plugin against the pinned
V2 API with `npm run check --prefix .opencode`.

## Development routing

The plugin at .opencode/plugins/openagent-agent-router.js runs only when
OpenGoCoder is the selected agent.

It derives an implementation-agent hint for a clear request or a single-stack
project:

- coder-agent for Go work or a Go-only project;
- open-frontend-specialist for UI work or a frontend-only project.

For a mixed project, no hint is added. In a single-stack project, project
detection can provide the corresponding hint even when the request is
ambiguous. The plugin never changes the agent handling the message: OpenGoCoder
always runs the context, planning, execution, quality, and documentation
workflow. task-manager records the selected implementation agent in the
relevant subtask; batch-executor delegates only that subtask to it.

No automatic routing occurs when another primary agent is selected. In
particular, MergeRequestReviewer and ProductOwner always remain the selected
agent.

## OpenGoCoder orchestration workflow

When a request is handled by OpenGoCoder, it uses the following workflow.

~~~
OpenGoCoder
  -> explore (from opencode)
  -> contextscout
  -> ExternalScout, only when current external documentation is needed
  -> task-manager
  -> validated task artifacts in .tmp/tasks/<feature>/
  -> batch-executor
       -> coder-agent for each ready implementation subtask
  -> test-engineer once after all implementation subtasks succeed
  -> reviewer once after the final test gate passes
  -> docwriter
  -> final report
~~~

OpenGoCoder never edits production code, tests, or documentation itself. It
does not report success until batch-executor and docwriter have both completed.

For a small, cohesive, low-risk change, OpenGoCoder can use its simple-task
route: one explicit subtask contract goes directly to batch-executor. The same
documentation handoff still runs after a successful implementation.

## Agents

### Primary agents

| Agent | Use it for | Does not do |
| --- | --- | --- |
| OpenGoCoder | Go development orchestration and recovery of an interrupted development workflow. | Write code, tests, or documentation directly. |
| MergeRequestReviewer | Review a GitLab/GitHub merge or pull request, publish actionable findings when the forge integration supports it, and submit one final review action. | Modify repository files or branches. |
| ProductOwner | User stories, issue-ready handoffs, and product documentation. | Implement code or invoke implementation agents. |
| system-builder | Explicitly bootstrap or extend OpenAgent context. | Edit context or application code directly. |

### Supporting agents

| Agent | Responsibility |
| --- | --- |
| contextscout | Mandatory read-only discovery before planned implementation. It follows the OpenAgent context navigation and returns ranked context and source references. |
| ExternalScout | Retrieves only the external documentation needed for a dependency or API. |
| task-manager | Produces the feature task artifacts, dependency graph, and narrow subtask contracts. |
| batch-executor | Schedules artifact-backed implementation work, retries validation fixes, and runs final quality gates. |
| coder-agent | Implements one bounded Go subtask and its narrow validation. |
| open-frontend-specialist | Creates accessible responsive HTML/CSS designs in design_iterations/. |
| test-engineer | Runs the final feature validation after implementation subtasks complete. |
| reviewer | Reviews the changed files after the final test gate. This is distinct from MergeRequestReviewer. |
| docwriter | Records every verified feature outcome in Project Intelligence and updates only the related Markdown records. |
| context-manager | Handles explicitly requested context structure, navigation, and catalog changes. |
| context-organizer | Creates or extends verified context Markdown from a system-builder handoff. |
| context-retriever | Performs a manual, read-only lookup in the existing OpenAgent context. It is not part of the implementation workflow. |

BuildAgent exists as a subagent definition, but the current batch-executor
workflow does not invoke it.

## Project Intelligence

Project knowledge lives in .opencode/context/project-intelligence/. The
navigation file is the starting point for domain, architecture, decisions, and
current project notes.

After each successful feature, docwriter:

1. adds a factual, newest-first entry to delivery-log.md;
2. records the delivered outcome, affected modules, validation, and follow-up;
3. updates technical-domain.md, business-tech-bridge.md, decisions-log.md, or
   living-notes.md only when the verified handoff requires it.

This gives later contextscout runs a project record without asking them to
reconstruct past deliveries.

## Context roles

- contextscout: automatic, read-only implementation discovery.
- context-retriever: manual question-and-answer lookup.
- context-manager: explicit structural maintenance only.
- docwriter: verified delivery and documentation updates.

The root navigation is .opencode/context/navigation.md. Consumers follow
navigation files before opening leaf context files.

## Commands

### /open-prompt

Use:

~~~
/open-prompt <short request>
~~~

The command expands the request into a concise, ready-to-paste OpenGoCoder
prompt. It preserves intent, avoids inventing tasks or file paths, and does not
inspect the repository, run tools, invoke agents, or implement code.

## Profiles and providers

The repository contains two profile files:

| File | Purpose |
| --- | --- |
| .opencode/profiles/local.jsonc | Local oMLX profile using http://localhost:9090/v1. Its default model is omlx/Qwen3.6-35B-A3B-MLX-4bit and it defines thinking and fast variants. |
| .opencode/profiles/provider.jsonc | Native V2 delegation-depth setting for hosted providers. It does not define a provider or default model. |

These profiles do not activate themselves: merge the chosen profile's settings
into `.opencode/opencode.jsonc`, preserving other providers, MCP servers and
permissions. They are native V2 JSONC templates, not standalone OpenAgent policy
files. Pass `execution_mode: local` or `execution_mode: provider` in the prompt;
the workflow defaults to `local`. Limits and routing preferences live in
`.opencode/context/mode/execution-modes.md`.

The local profile sends `chat_template_kwargs` as variant HTTP body fields.
The legacy `params.repeatPenalty` had no documented native V2 equivalent and is
retained only in the archive; configure a repetition penalty only after checking
the actual oMLX endpoint's accepted parameter. Model availability, these body
extensions and context limits must be checked against the running local server.

### V2 behavior to account for

- Permissions use ordered rules: broad defaults precede specific exceptions.
  `shell` replaces `bash`, `subagent` replaces `task`, and `edit` covers all file
  mutations. The merge-request reviewer remains read-only. Path wildcards use
  V2 matching (`*` includes slashes), so root-level and nested files are covered.
- Agent temperatures are retained under `request.body`. Current V2 documentation
  says agent request overlays are not yet sent to the model; use provider/model
  settings if an effective temperature is required.
- V2 does not run the configured LSP servers. Use explicit gopls CLI/MCP support
  when available, and compiler/lint/test commands for diagnostics.
- Upstream Go skills retain portable source metadata and examples for other
  clients. Their `allowed-tools` fields do not grant OpenCode permissions; the
  agent's V2 permissions and actual tool catalog govern execution. Use `AGENTS.md`
  for project instructions, and `shell`, `subagent`, `question` and configured MCP
  tools in place of client-specific tool names.
- Terminal preferences belong in the global `~/.config/opencode/cli.json`, not
  a project `tui.json` or `opencode.jsonc`.
- The router appends its hint at prompt admission, preserving existing attachment
  mention offsets, and reads the session location after moves.

## Repository layout

~~~
.opencode/
  agents/
    core/                 primary agents
    subagents/code/       implementation and quality agents
    subagents/core/       discovery, planning, execution, and documentation
    subagents/system-builder/ context bootstrap subagents
    local/                specialized review panel
  commands/
    open-prompt.md
  context/
    core/                 workflow and context-system rules
    project-intelligence/ project record and delivery log
    standards/            Go conventions
  plugins/
    openagent-agent-router.js
  profiles/
    local.jsonc
    provider.jsonc
  skills/
    go/
    task-management/
  tests/                  V2 configuration and routing regressions
  opencode.example.jsonc  shareable runtime template
.opencodev1/              frozen snapshot for V1 symlinks
~~~

## Validation behavior

A planned feature is complete only when:

1. its implementation subtasks have completed through batch-executor;
2. the final test-engineer and reviewer gates pass;
3. docwriter records the verified delivery.

Any validation or documentation failure stops the workflow and is reported
instead of being treated as a successful delivery.
