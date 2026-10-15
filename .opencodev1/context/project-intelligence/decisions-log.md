<!-- Context: project-intelligence/decisions | Priority: high | Version: 1.0 | Updated: 2025-01-12 -->

# Decisions Log

> Record major architectural and business decisions with full context. This prevents "why was this done?" debates.

## Quick Reference

- **Purpose**: Document decisions so future team members understand context
- **Format**: Each decision as a separate entry
- **Status**: Decided | Pending | Under Review | Deprecated

## Decision Template

```markdown
## [Decision Title]

**Date**: YYYY-MM-DD
**Status**: [Decided/Pending/Under Review/Deprecated]
**Owner**: [Who owns this decision]

### Context
[What situation prompted this decision? What was the problem or opportunity?]

### Decision
[What was decided? Be specific about the choice made.]

### Rationale
[Why this decision? What were the alternatives and why were they rejected?]

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected? |
|-------------|------|------|---------------|
| [Alt 1] | [Pros] | [Cons] | [Why not chosen] |
| [Alt 2] | [Pros] | [Cons] | [Why not chosen] |

### Impact
**Positive**: [What this enables or improves]
**Negative**: [What trade-offs or limitations this creates]
**Risk**: [What could go wrong]

### Related
- [Links to related decisions, PRs, issues, or documentation]
```

---

## Decision: Scope Gx CCR decoding to confirmed inbound AVPs

**Date**: 2026-09-12
**Status**: Decided

### Context
The PCF Gx CCR parser and handler were incomplete, while existing request models, AVP helpers, and SM policy dispatch paths defined the confirmed integration surface.

### Decision
Decode only present, confirmed inbound Gx CCR AVPs into the existing SM policy request models. Dispatch Initial, Update, and Termination CCRs through the existing flows, marking Initial requests with `SourceGx`; retain Diameter `Session-Id` for Update and Termination dispatch. Parse Framed-IPv6-Prefix using the fixed 16-byte prefix encoding.

### Rationale
This completes the supported flow without deriving inbound requirements from the reciprocal PGW-C CCA builder or introducing unverified correlation and error behavior.

### Impact
- **Positive**: Gx CCR request handling is covered by parser and handler tests, including a `/64` IPv6 prefix case.
- **Negative**: Association correlation and generalized malformed-AVP/result-code handling remain outside the implementation.
- **Risk**: Service persistence may use `SUPI-PduSessionID` while Update and Termination use Diameter `Session-Id`.

---

## Decision: [Title]

**Date**: YYYY-MM-DD
**Status**: [Status]
**Owner**: [Owner]

### Context
[What was happening? Why did we need to decide?]

### Decision
[What we decided]

### Rationale
[Why this was the right choice]

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected? |
|-------------|------|------|---------------|
| [Option A] | [Good things] | [Bad things] | [Reason] |
| [Option B] | [Good things] | [Bad things] | [Reason] |

### Impact
- **Positive**: [What we gain]
- **Negative**: [What we trade off]
- **Risk**: [What to watch for]

### Related
- [Link to PR #000]
- [Link to issue #000]
- [Link to documentation]

---

## Decision: [Title]

**Date**: YYYY-MM-DD
**Status**: [Status]
**Owner**: [Owner]

### Context
[What was happening?]

### Decision
[What we decided]

### Rationale
[Why this was right]

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected? |
|-------------|------|------|---------------|
| [Option A] | [Good things] | [Bad things] | [Reason] |

### Impact
- **Positive**: [What we gain]
- **Negative**: [What we trade off]

### Related
- [Link]

---

## Deprecated Decisions

Decisions that were later overturned (for historical context):

| Decision | Date | Replaced By | Why |
|----------|------|-------------|-----|
| [Old decision] | [Date] | [New decision] | [Reason] |

## Onboarding Checklist

- [ ] Understand the philosophy behind major architectural choices
- [ ] Know why certain technologies were chosen over alternatives
- [ ] Understand trade-offs that were made
- [ ] Know where to find decision context when questions arise
- [ ] Understand what decisions are pending and why

## Related Files

- `technical-domain.md` - Technical implementation affected by these decisions
- `business-tech-bridge.md` - How decisions connect business and technical
- `living-notes.md` - Current open questions that may become decisions
