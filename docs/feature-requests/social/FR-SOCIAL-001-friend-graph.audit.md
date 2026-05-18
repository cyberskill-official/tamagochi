---
fr_id: FR-SOCIAL-001
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

Friend graph with asymmetric pending/accepted rows, invite codes (Crockford base32), silent reject (anti-harassment), 7-day re-add cooldown, 100/500 limits, kid display_name alias, cross-SKU + cross-tenant blocking, Colyseus presence. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Race on accept.** Round-1. **RESOLVED §10 row 2** — mutex via SQL where-clause.
- **ISS-002 (warning) Blocklist evasion.** Round-1. **RESOLVED §10 row 5** — DPO escalation.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Cross-tenant friend.** Round-2. **RESOLVED §10 row 4** — RLS denies.
- **ISS-004 (info) Code collision.** Round-2. **RESOLVED §10 row 1** — retry.
- **ISS-005 (info) Display_name alias on kids.** Round-2. **RESOLVED §10 row 9** — build-target check.
- **ISS-006 (info) DSR cascade.** Round-2. **RESOLVED §10 row 10** — foreign-key cascade.

## §4 — Strengths preserved

- Asymmetric model allows independent state.
- Silent reject + 7-day cooldown anti-harassment.
- Kid alias preserves COPPA.
- Cross-SKU + cross-tenant scoping.
- Presence via Colyseus.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. SOCIAL-002/003/004 now have graph.
