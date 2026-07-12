---
fr_id: FR-VIRAL-004
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

Battle pass — 4-week season + 40 tiers + free/premium track + daily/weekly objectives + retroactive premium + 7-day claim grace + family tier bundle (Pet+ separate) + tenant-aware + disclosed rewards. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Mystery tier reward leak.** Round-1. **RESOLVED §1.2 + §10 row 4** — boot-time config validation rejects.
- **ISS-002 (warning) XP race on concurrent care.** Round-1. **RESOLVED §10 row 11** — mutex.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Season auto-start fail.** Round-2. **RESOLVED §10 row 1** — daily check + manual restart.
- **ISS-004 (info) Mid-season pricing.** Round-2. **RESOLVED §10 row 7** — Apple/Google block.
- **ISS-005 (info) Reward forfeit before grace.** Round-2. **RESOLVED §10 row 9** — manual grant.
- **ISS-006 (info) Tenant season leak.** Round-2. **RESOLVED §10 row 8** — RLS.

## §4 — Strengths preserved

- Disclosed rewards align with FR-LEGAL-002.
- Cross-FR XP integration (care + mini-game + streak).
- Retroactive premium respects UX expectations.
- Family tier bundle deepens Family value prop.
- Pet+ separate maintains parallel monetization.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-VIRAL-005 last for P3.
