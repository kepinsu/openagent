---
name: gitlab-discussions
description: "Create and manage native GitLab merge-request discussions for actionable review findings. Use when reviewing a GitLab merge request and publishing or replying to inline or general threads, checking existing discussions for duplicates, or turning a precise code concern into a GitLab thread."
---

# GitLab Discussions

Use the connected GitLab MCP only to publish concrete, actionable review findings as native merge-request discussions.

## Capability Check

1. Resolve the GitLab project and merge-request IID from the request or configured forge context.
2. Read the existing merge-request discussions, including their notes and resolution state.
3. Identify the MCP operation that creates a native merge-request discussion. Do not substitute a plain note when a thread is required.
4. If the connector cannot create native discussions, report the missing capability and return the findings without publishing them.

## Publication Workflow

For every candidate finding:

1. Confirm it is introduced by the merge request, concrete, actionable, and not already covered by an existing discussion.
2. Use one discussion per independent root cause. Do not combine unrelated issues in one thread.
3. Create an inline discussion only when the changed file (the entiere path), side, line, and diff position are known accurately. Provide the merge-request diff version identifiers and position data required by the GitLab operation. Never guess a diff position.
4. Create a general merge-request discussion when the concern spans files, concerns tests or design, or lacks a reliable changed-line position.
5. Publish a compact body in the merge request's primary language:

```text
[P1] Short title
Impact: concrete consequence and triggering path.
Suggested fix: smallest safe remediation.
```

6. Confirm that the operation returned a discussion or thread identifier before reporting it as published. Record that identifier in the review ledger.

## Critical Rule for Inline Comments

Before attempting any inline thread:

1. Always call gitlab_get_merge_request_file_diff with unidiff: false to retrieve the structured diff response that contains GitLab-provided line_code values.
2. Extract the exact line_code for the target file and target line from that structured response. Never invent, derive, or guess a line_code; it has the GitLab format {file_path_sha1_hash}*{old_line_number}*{new_line_number} and must come from GitLab.
3. Confirm diff_refs are present and include base_sha, head_sha, and start_sha.
4. Call list_merge_request_changed_files and confirm the target file exists in the changed-file list.
5. Use the exact file_path returned by GitLab in the inline position, including any repository prefix such as network-functions/.
6. Verify the selected line_code is non-empty and valid before creating the inline thread.
7. If gitlab_get_merge_request_file_diff does not return a structured line_code, the diff is too large, the path cannot be matched exactly, or any prerequisite above is missing, immediately create a native general merge-request discussion with gitlab_create_merge_request_thread without position. Do not retry as inline.

## Existing Discussions

Do not open a duplicate thread for the same root cause, affected behavior, and remediation.

Reply to an existing thread only when new evidence materially changes the finding or answers a direct question. Keep replies specific to that thread. Do not reopen or resolve threads unless the request explicitly asks for it and the GitLab connector supports the action.

## Guardrails

- Do not publish preferences, praise, speculation, or pre-existing defects as review threads.
- Do not expose credentials, tokens, private configuration, or hidden analysis.
- Do not claim that a thread was created until GitLab confirms it.
- Do not create a general note merely because inline positioning failed; create a native general discussion instead.
- Keep the final report to the published discussion identifiers, their placement, and any findings that could not be published.
