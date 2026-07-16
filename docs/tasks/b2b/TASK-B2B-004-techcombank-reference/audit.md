---
fr_id: TASK-B2B-004
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

Techcombank flagship tenant — under-13 default + SSO + savings-quest mini-game via webhook + financial-literacy quiz + per-account-holder unique mascot + Singapore data residency + one-way bank→pet only + 10-year audit. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Real-money out.** Round-1. **RESOLVED §1.10 + §10 row 8** — validation blocks.
- **ISS-002 (warning) Cross-tenant trade.** Round-1. **RESOLVED §1.12 + §10 row 6** — enforced.

## §3 — Round-2 findings (resolved)

- **ISS-003 (info) TCB SSO outage.** Round-2. **RESOLVED §10 row 1** — UX hint.
- **ISS-004 (info) Parental consent stuck.** Round-2. **RESOLVED §10 row 12** — vendor escalation.
- **ISS-005 (info) DPA expiry.** Round-2. **RESOLVED §10 row 11** — annual re-execution.
- **ISS-006 (info) Webhook polling fallback.** Round-2. **RESOLVED §10 row 5** — reconciliation.

## §4 — Strengths preserved

- Audience under-13 default with COPPA-2025 strict.
- One-way bank → pet avoids AML scrutiny.
- Singapore residency aligns with PDPL.
- 10-year audit banking-grade.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-B2B-005 Viettel next.
