# OpenAgent

OpenCode configuration for a bounded multi-agent workflow: Go development,
focused frontend design, product work, merge-request review, and project
knowledge maintenance.

OpenAgent was initially inspired by
[OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl) and uses
the Go skills from [cc-skills-golang](https://github.com/samber/cc-skills-golang).
Its agents and execution rules are maintained locally in this repository.

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
| Go development | OpenGoCoder | Development entry point; the development router may select a Go or frontend specialist. |
| Frontend design | OpenGoCoder with a clear UI request | The router can select open-frontend-specialist. |
| Context bootstrap or extension | system-builder | Delegates verified context work to context-organizer. |
| Merge or pull request review | MergeRequestReviewer | Read-only review workflow; it is never auto-selected. |
| Product story, issue, or product documentation | ProductOwner | Product workflow; it is never auto-selected. |
| Turn a short request into an OpenGoCoder prompt | /open-prompt request | Returns a bounded prompt only; it does not implement anything. |

## Development routing

The plugin at .opencode/plugins/openagent-agent-router.js runs only when
OpenGoCoder is the selected agent.

It selects one direct development agent for a clear request or a single-stack
project:

- coder-agent for Go work or a Go-only project;
- open-frontend-specialist for UI work or a frontend-only project.

For a mixed project, it leaves OpenGoCoder selected. In a single-stack project, project detection can select the corresponding development agent even when the request is ambiguous. The plugin
changes the agent handling that message; it does not delegate a subtask and it
does not change models, credentials, or provider settings.

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
| .opencode/profiles/provider.jsonc | Compact limits and routing policy intended for hosted providers. It does not define a provider or default model. |

These profiles do not activate themselves: the repository contains no profile
switch command. Keep .opencode/opencode.jsonc aligned with the profile you
intend OpenCode to use.

## Repository layout

~~~
.opencode/
  agent/
    core/                 primary agents
    subagents/code/       implementation and quality agents
    subagents/core/       discovery, planning, execution, and documentation
    subagents/system-builder/ context bootstrap subagents
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
~~~

## Validation behavior

A planned feature is complete only when:

1. its implementation subtasks have completed through batch-executor;
2. the final test-engineer and reviewer gates pass;
3. docwriter records the verified delivery.

Any validation or documentation failure stops the workflow and is reported
instead of being treated as a successful delivery.
