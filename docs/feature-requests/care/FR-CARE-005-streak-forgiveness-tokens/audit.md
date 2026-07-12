---
fr_id: FR-CARE-005
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Streak system with ethical forgiveness tokens (3/mo auto-applied, no-FOMO copy, monthly reset), local-region day boundaries, Cozy Hour weekly window (Mixpanel-flag-tuned, Saturday 19:00 local default), milestone rewards, no-leaderboard kids-SKU restriction, transparent token history. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Region change exploit.** Round-1: VPN-shift could fake a streak. **RESOLVED §10 row 2** — lock region or treat region-change as vacation day.
- **ISS-002 (warning) Token race condition.** Round-1: concurrent missed-day jobs could over-consume tokens. **RESOLVED §10 row 5** — atomic UPDATE WHERE clause.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Milestone double-credit.** Round-2: edge case where milestone fires twice. **RESOLVED §10 row 6** — per-player milestone-reached state tracking.
- **ISS-004 (info) Mixpanel flag null.** Round-2: missing flag config. **RESOLVED §10 row 3** — fallback default.
- **ISS-005 (info) i18n missing keys.** Round-2: non-EN locale missing strings. **RESOLVED §10 row 8** — EN fallback + missing-key event.
- **ISS-006 (info) Pet+ +1 token entitlement bug.** Round-2: FR-SUB-001 integration risk. **RESOLVED §10 row 7** — manual +1 + investigate path.

## §4 — Strengths preserved

- Auto-applied tokens remove the cognitive load — ethical retention.
- No FOMO copy aligns with Apple Kids + ICO AADC.
- Local-region midnight respects fair timezone math.
- Cozy Hour is local-time-applied → fair worldwide.
- Per-player streak (not per-pet) matches multi-pet vision.
- Forgiveness transparency builds trust + COPPA-2025 spirit.
- Milestone rewards mix Coins + badges + bonus tokens.
- Cross-references to FR-VIRAL-004/005, FR-SUB-001, FR-LEGAL-001 are explicit.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. CARE slice complete (5/5). FR-PET-002 care-gated stall + this streak combo is the canonical daily-engagement substrate.
