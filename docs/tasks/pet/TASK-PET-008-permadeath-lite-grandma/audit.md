---
fr_id: TASK-PET-008
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

Permadeath-Lite covers 7-day all-stat-zero trigger, escalating warnings (day 3/5/7), grandma_house stage with non-decay + slot-exempt + trade/breed-blocked, 3-day rescue ritual with 18h cooldown + 48h skip reset, no real-money revival, tier preservation, non-shaming UX. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) DST 18h cooldown timing.** Round-1: cooldown shifts on DST transition. **RESOLVED §10 row 9** — IANA TZ-aware clock.
- **ISS-002 (warning) Cron missed transitions.** Round-1: scheduled function lag. **RESOLVED §10 row 2** — composite index.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Concurrent ritual taps.** Round-2: double-tap race. **RESOLVED §10 row 11** — per-pet mutex.
- **ISS-004 (info) 48h reset confusion.** Round-2: UX clarity. **RESOLVED §10 row 5** — surface count clearly.
- **ISS-005 (info) Last-active-stage migration.** Round-2: missing column. **RESOLVED §3 + §10 row 10** — explicit column.
- **ISS-006 (info) Audit retention COPPA.** Round-2: kid grandma history. **RESOLVED §10 row 12** — 7-year retention.

## §4 — Strengths preserved

- All-4-zero trigger requires sustained neglect (not single-stat punishment).
- Escalating warnings give multiple chances.
- 3-day ritual proportional to 7-day neglect.
- Grandma exempt from slot quota encourages rescue.
- No real-money revival.
- Tier + species preserved.
- Non-shaming copy.
- AI persona during grandma drives emotional re-engagement.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. P2 PET slice complete (4/4).
