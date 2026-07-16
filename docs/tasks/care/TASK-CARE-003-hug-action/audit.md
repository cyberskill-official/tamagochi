---
fr_id: TASK-CARE-003
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

Hug spec covers zero-cost free care action with 24h diminishing-returns soft cap, 30s per-hug cooldown, 120/hr overall, region-aware daily reset, first-pat shared handler with onboarding bypass, AI surface integration. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Onboarding bypass abuse vector.** Round-1: §1.18 header could be forged or kept by an attacker. **RESOLVED §10 row 3 + row 9** — sign bypass via HMAC + ephemeral key; reject bypass when onboarding already complete.
- **ISS-002 (warning) Daily counter Redis loss.** Round-1: counter unavailability could let unlimited hugs. **RESOLVED §10 row 1** — fail-closed.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Region-change-during-day exploit.** Round-2: a player could VPN-shift regions to reset their cap. **RESOLVED §10 row 2** — reset only if local-day boundary actually crossed; UTC fallback.
- **ISS-004 (info) DST boundary.** Round-2: DST transition could double-bill the cap. **RESOLVED §10 row 8** — 36h expiry covers it.
- **ISS-005 (info) Lottie missing asset fallback.** Round-2: heart-burst could fail to load. **RESOLVED §10 row 4** — static fallback icon.
- **ISS-006 (info) Wedding-ceremony bonus path.** Round-2: TASK-SOCIAL-004 wedding might want a hug bonus. **RESOLVED §10 row 7** — handled via TASK-SOCIAL-004 separate path, not this task.

## §4 — Strengths preserved

- Zero-cost free action — daily-engagement primitive without churn.
- Diminishing returns is non-punitive yet anti-spam.
- 30s + 120/hr layered limits.
- First-pat reuse avoids two code paths.
- AI surface integration sets up TASK-AI-001 dialogue richness.
- Region-aware daily reset respects timezone reality.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. Onboarding bypass discipline is the load-bearing security improvement from this audit.
