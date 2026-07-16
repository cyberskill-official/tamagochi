---
fr_id: TASK-ADS-002
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

Kids contextual-only via SuperAwesome kWS, 3/day + 2/session caps, 10-min cooldown, 30 Coins reward, 10-min warmup ad-free period, parental ad-disable, separate kWS workspace, SSV. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) LevelPlay/AppLovin in kids binary.** Round-1. **RESOLVED §10 row 3 + TASK-LEGAL-003 §1.10** — binary inspection.
- **ISS-002 (warning) Cross-workspace data.** Round-1. **RESOLVED §10 row 7** — separate workspace.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Warmup race via app restart.** Round-2. **RESOLVED §10 row 5** — server-tracked session_start.
- **ISS-004 (info) Parent disable race.** Round-2. **RESOLVED §10 row 6** — idempotent last-wins.
- **ISS-005 (info) Ad CTA out-of-app.** Round-2. **RESOLVED §10 row 9** — OS-handled + resume.
- **ISS-006 (info) Offensive ad content.** Round-2. **RESOLVED §10 row 10** — kWS escalation path.

## §4 — Strengths preserved

- kWS-only respects TASK-LEGAL-001 §1.5(d).
- Lower cap + 10-min cooldown + warmup respects kid-app guidelines.
- Parental override + separate workspace.
- SSV server-side validation.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. ADS slice complete (2/2).
