---
fr_id: TASK-SUB-001
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

Pet+ at $4.99/mo or $39.99/yr (VN ₫99K/₫799K) via Apple/Google subscriptions, 16-day grace period, Apple ASSN V2 + Google RTDN webhooks with dedupe, restore-purchase, Family Sharing, monthly 100 Hearts grant, seasonal pet rotation, kids cannot subscribe (Family tier path via TASK-SUB-002). 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Webhook replay double-grant.** Round-1: Apple/Google retry. **RESOLVED §10 row 2 + §1.18** — dedupe table.
- **ISS-002 (warning) Cache invalidation on webhook.** Round-1. **RESOLVED §1.5 + §10 row 8** — invalidate on webhook receipt.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Grace state race.** Round-2. **RESOLVED §10 row 4** — per-user mutex.
- **ISS-004 (info) Restore-purchase failure.** Round-2. **RESOLVED §10 row 3** — UX retry path.
- **ISS-005 (info) Trial accidentally enabled.** Round-2. **RESOLVED §10 row 11** — Apple Connect review catches.
- **ISS-006 (info) Annual cancel UX.** Round-2. **RESOLVED §10 row 12** — UX clarifies.

## §4 — Strengths preserved

- $4.99/mo aligns with industry standard.
- 16-day grace prevents punitive downgrade.
- Apple/Google subscription compliance.
- Webhook dedupe is critical for billing correctness.
- Monthly Hearts grant adds perceived value.
- Family Sharing honoured.
- No kids-direct-subscribe respects COPPA.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-SUB-002 Family tier extends this.
