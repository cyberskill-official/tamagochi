---
fr_id: TASK-ADS-001
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

Rewarded video only (no interstitials/banners), LevelPlay + AppLovin MAX waterfall, 50 Coins per view, 8/day + 3/session caps, 5-min cooldown, server-side validation, Pet+ ad-free, kids forbidden, contextual default. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) SSV signature forgery.** Round-1. **RESOLVED §1.7 + §10 row 2** — HMAC-SHA256 + secret rotation.
- **ISS-002 (warning) Replay protection.** Round-1. **RESOLVED §10 row 3** — view_id uniqueness + idempotent grant.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Kid SKU bypass.** Round-2. **RESOLVED §10 row 5** — RLS + SKU gate.
- **ISS-004 (info) Onboarding ad accidental.** Round-2. **RESOLVED §10 row 7** — build-target gate.
- **ISS-005 (info) EEA consent flow.** Round-2. **RESOLVED §10 row 9** — pre-launch QA.
- **ISS-006 (info) Timezone cap drift.** Round-2. **RESOLVED §10 row 12** — TZ-locked.

## §4 — Strengths preserved

- Rewarded-only respects kid-app retention concerns.
- SSV server-side validation closes fraud surface.
- Contextual default sidesteps GDPR personalisation issues.
- Pet+ ad-free preserves subscription value.
- Kids SKU forbidden + TASK-ADS-002 contextual gate next.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-ADS-002 next.
