---
fr_id: FR-VIRAL-005
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

Push notifications via FCM + APNs through Supabase Edge Functions, sleep-hour respect (kids wider window), frequency cap (3/day standard, 1/day kids), per-category opt-in, marketing default-OFF, no engagement push for under-13 (COPPA-2025), localised copy. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Engagement push slip for under-13.** Round-1. **RESOLVED §10 row 5** — explicit category-block.
- **ISS-002 (warning) DST sleep window.** Round-1. **RESOLVED §10 row 3** — IANA TZ.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Idempotency Redis loss.** Round-2. **RESOLVED §10 row 6** — 5-min window bounds.
- **ISS-004 (info) Locale missing.** Round-2. **RESOLVED §10 row 4** — EN fallback.
- **ISS-005 (info) Deep link kid external.** Round-2. **RESOLVED §10 row 9** — validation.
- **ISS-006 (info) Marketing default-ON regression.** Round-2. **RESOLVED §10 row 12** — test enforced.

## §4 — Strengths preserved

- Per-category opt-in respects ICO AADC.
- Wider kids sleep window per COPPA-2025.
- Localised copy server-side.
- Token lifecycle handled on sign-out + uninstall.
- Deep link in-app only for kids.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. P3 complete (9/9 FRs at 10/10).
