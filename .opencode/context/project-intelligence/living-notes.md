<!-- Context: project-intelligence/notes | Priority: high | Version: 1.0 | Updated: 2025-01-12 -->

# Living Notes

> Active issues, technical debt, open questions, and insights that don't fit elsewhere. Keep this alive.

## Quick Reference

- **Purpose**: Capture current state, problems, and open questions
- **Update**: Weekly or when status changes
- **Archive**: Move resolved items to bottom with status

## Technical Debt

### OpenCode V2 validation limits (2026-10-15)

- Target: OpenCode/plugin/schema 2.0.29; tooling requires Node.js 22.19+.
  This workstation's default Node was 18; checks used Node 22.23.3 via npm exec.
- Agent `request.body.temperature` is retained but current V2 docs say agent
  request overlays are not sent. Configure effective settings on providers or
  models when needed.
- LSP configuration is retained only as a private reference: V2 does not run it.
  Use explicit CLI/MCP integrations and compiler/lint/test diagnostics.
- Local profile variants send `chat_template_kwargs` as HTTP body fields. The
  unsupported legacy `params.repeatPenalty` remains only in the archive until
  the deployed oMLX server's accepted parameter is verified.
- During live edits the existing service logged a skill-watcher subscription
  timeout. Fresh isolated V2 startup discovered all skills successfully. If an
  existing session retains a stale catalog, restart the service after ending
  active work and start a new session.

| Item | Impact | Priority | Mitigation |
|------|--------|----------|------------|
| [Debt item] | [What risk it creates] | [High/Med/Low] | [How to manage] |

### Technical Debt Details

**[Debt Item]**  
*Priority*: [High/Med/Low]  
*Impact*: [What happens if not addressed]  
*Root Cause*: [Why this debt exists]  
*Proposed Solution*: [How to fix it]  
*Effort*: [Small/Medium/Large]  
*Status*: [Acknowledged | Scheduled | In Progress | Deferred]

## Open Questions

| Question | Stakeholders | Status | Next Action |
|----------|--------------|--------|-------------|
| [Question] | [Who needs to decide] | [Open/In Progress] | [What needs to happen] |

### Open Question Details

**[Question]**  
*Context*: [Why this question matters]  
*Stakeholders*: [Who needs to be involved]  
*Options*: [What are the possibilities]  
*Timeline*: [When does this need resolution]  
*Status*: [Open/In Progress/Blocked]

## Known Issues

| Issue | Severity | Workaround | Status |
|-------|----------|------------|--------|
| Full build and lint were not run for Gx CCR completion. | Low | Package tests passed; run repository build and lint before broader integration or release use. | Known |

| Issue | Severity | Workaround | Status |
|-------|----------|------------|--------|
| [Issue] | [Critical/High/Med/Low] | [Temporary fix] | [Known/In Progress/Fixed] |

### Issue Details

**[Issue Title]**  
*Severity*: [Critical/High/Med/Low]  
*Impact*: [Who/what is affected]  
*Reproduction*: [Steps to reproduce if applicable]  
*Workaround*: [Temporary solution if exists]  
*Root Cause*: [If known]  
*Fix Plan*: [How to properly fix]  
*Status*: [Known/In Progress/Fixed in vX.X]

## Insights & Lessons Learned

### What Works Well
- [Positive pattern 1] - [Why it works]
- [Positive pattern 2] - [Why it works]

### What Could Be Better
- [Area for improvement 1] - [Why it's a problem]
- [Area for improvement 2] - [Why it's a problem]

### Lessons Learned
- [Lesson 1] - [Context and implication]
- [Lesson 2] - [Context and implication]

## Patterns & Conventions

### Code Patterns Worth Preserving
- [Pattern 1] - [Where it lives, why it's good]
- [Pattern 2] - [Where it lives, why it's good]

### Gotchas for Maintainers
- [Gotcha 1] - [What to watch out for]
- [Gotcha 2] - [What to watch out for]

## Active Projects

| Project | Goal | Owner | Timeline |
|---------|------|-------|----------|
| [Project] | [What we're doing] | [Who owns it] | [When it matters] |

## Archive (Resolved Items)

Moved here for historical reference. Current team should refer to current notes above.

### Resolved: [Item]
- **Resolved**: [Date]
- **Resolution**: [What was decided/done]
- **Learnings**: [What we learned from this]

## Onboarding Checklist

- [ ] Review known technical debt and understand impact
- [ ] Know what open questions exist and who's involved
- [ ] Understand current issues and workarounds
- [ ] Be aware of patterns and gotchas
- [ ] Know active projects and timelines
- [ ] Understand the team's priorities

## Related Files

- `decisions-log.md` - Past decisions that inform current state
- `business-domain.md` - Business context for current priorities
- `technical-domain.md` - Technical context for current state
- `business-tech-bridge.md` - Context for current trade-offs
