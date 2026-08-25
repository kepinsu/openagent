# OpenAgent

Opinionated multi-agent workflow for OpenCode, focused on Go projects.

This repository provides a complete orchestration pipeline for software engineering tasks. Rather than relying on a single coding agent, implementation work is decomposed into specialized agents responsible for planning, execution, validation and documentation.

The project was originally inspired by:

- [OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl)

but has since evolved into a different execution model with stricter agent responsibilities and a hierarchical orchestration pipeline.

The project use :

- [cc-skills-golang](https://github.com/samber/cc-skills-golang)

---

# Philosophy

Every agent should have **one responsibility**.

Instead of asking a single LLM to perform every task, OpenAgent separates the software engineering workflow into independent stages:

- discover project context;
- retrieve external knowledge;
- plan the implementation;
- execute implementation;
- validate the result;
- update documentation.

This produces a workflow that is easier to reason about, easier to extend and significantly more predictable.

---

# Call Flow

```
                    User Request
                         │
                         ▼
                  OpenGoCoder
                         │
         ┌───────────────┼────────────────┐
         ▼               ▼                ▼
   contextscout    ExternalScout     TaskManager
                                           │
                                           ▼
                                   Execution Plan
                                           │
                                           ▼
                                    BatchExecutor
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
              contextscout (optional)                    Parallel execution
                                                            │
                                               ┌────────────┴────────────┐
                                               ▼                         ▼
                                         CoderAgent                CoderAgent
                                               │                         │
                                               └────────────┬────────────┘
                                                            ▼
                                                     TestEngineer
                                                            │
                                                Validation successful?
                                                   │              │
                                                   │ No           │ Yes
                                                   ▼              ▼
                                              Retry through   Next task
                                              CoderAgent          │
                                                                  ▼
                                                          Batch completed
                                                                  │
                                                                  ▼
                                                            docwriter
                                                                  │
                                                                  ▼
                                                            Final Report
```

---

# Agent Responsibilities

## OpenGoCoder

Top-level orchestrator.

Responsible for:

- understanding the user request;
- collecting project context;
- retrieving external documentation;
- creating an execution plan;
- delegating execution;
- producing the final report.

OpenGoCoder **never writes production code**.

---

## contextscout

Discovers project knowledge before implementation.

Examples:

- architecture
- ADRs
- coding conventions
- existing implementations
- project standards
- testing strategy

---

## ExternalScout

Retrieves external documentation required for implementation.

Examples:

- Go libraries
- APIs
- SDKs
- framework documentation

---

## TaskManager

Transforms the user request into an execution plan.

The execution plan contains:

- implementation tasks
- dependency graph
- execution order
- parallel opportunities
- acceptance criteria

TaskManager never implements code.

---

## BatchExecutor

Execution supervisor.

BatchExecutor owns the implementation lifecycle.

Responsibilities:

- dispatch implementation agents
- coordinate parallel execution
- invoke validation agents
- retry failed implementations
- report execution status

BatchExecutor never edits source code directly.

---

## CoderAgent

Implements a single task.

Responsibilities:

- write production code
- modify existing code
- satisfy acceptance criteria

Each CoderAgent focuses on one implementation task.

---

## TestEngineer

Validates each implementation.

Responsibilities:

- execute tests
- create missing tests when required
- detect regressions
- provide actionable feedback

If validation fails, BatchExecutor sends the task back to the implementation agent.

---

## docwriter

Updates project documentation after successful implementation.

---

# Design Principles

## Single Responsibility

Every agent owns exactly one responsibility.

---

## Hierarchical Delegation

Higher-level agents never perform work that belongs to lower-level agents.

```
OpenGoCoder
    ↓
TaskManager
    ↓
BatchExecutor
    ↓
CoderAgent
```

---

## Validation First

Implementation is not considered complete until validation succeeds.

A task follows the lifecycle:

```
Implementation
        │
        ▼
 Validation
        │
   ┌────┴────┐
   │         │
 Fail      Pass
   │         │
   ▼         ▼
 Retry    Complete
```

---

## Parallel by Default

Independent implementation tasks are executed simultaneously whenever possible.

---

## Context Before Code

Implementation agents receive project knowledge before writing code.

This minimizes duplicated work and keeps implementations aligned with the existing architecture.

---

# Current Status

This repository currently focuses on **Go** projects.

Additional language-specific orchestrators can be added later while reusing the same orchestration pipeline.

---

# Roadmap

- BuildAgent integration
- CodeReviewer integration
- MCP-powered project search
- Git workflow automation
- Additional language orchestrators (Python, TypeScript, Rust)