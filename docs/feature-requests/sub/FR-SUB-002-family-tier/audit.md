---
fr_id: FR-SUB-002
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.4/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Family tier $9.99/mo for up to 5 children + parental dashboard, screen-time cap, spend cap with parental approval push, content filter override, cross-SKU family link (parent standard + children kids project), VPC per child via FR-AUTH-003, DSR cascade. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Cross-SKU token security.** Round-1. **RESOLVED §10 row 2** — signed tokens + RLS.
- **ISS-002 (warning) Cascade delete grace.** Round-1. **RESOLVED §10 row 5** — 30-day delete grace.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Family tier downgrade UX.** Round-2. **RESOLVED §10 row 6** — read-only mode.
- **ISS-004 (info) Friend approval queue bloat.** Round-2. **RESOLVED §10 row 9** — per-child cap.
- **ISS-005 (info) Apple Family Sharing skipped.** Round-2. **RESOLVED §10 row 10** — pre-emptive layer.
- **ISS-006 (info) DSR cascade accidental.** Round-2. **RESOLVED §10 row 8** — pre-deletion warning.

## §4 — Strengths preserved

- Parental dashboard is mandatory COPPA-2025 surface.
- VPC per child even with Family Sharing.
- Default spend cap 0 is default-safe.
- AI dialogue override even for 13+ children.
- Cross-SKU link bridges adult+kids Supabase projects.
- Two-layer approval (in-app + OS).

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. SUB slice complete.
