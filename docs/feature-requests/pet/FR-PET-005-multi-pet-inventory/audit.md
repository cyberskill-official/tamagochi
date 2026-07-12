---
fr_id: FR-PET-005
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

Multi-pet inventory with 3/10 free/Pet+ split, grandma+tombstoned exclusion from quota, downgrade-keeps-existing policy, DB trigger defense-in-depth, migration script for P1→P2 legacy data, non-FOMO upgrade prompt, multi-device Colyseus broadcast. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Downgrade race with hatch.** Round-1: concurrent downgrade + hatch could violate quota. **RESOLVED §10 row 7** — per-user mutex on slot ops.
- **ISS-002 (warning) Trigger overhead on migration.** Round-1: bulk insert performance. **RESOLVED §10 row 11** — disable trigger; verify after.

## §3 — Round-2 findings (resolved)

- **ISS-003 (info) Stub entitlement testability.** Round-2: SLOT_ENTITLEMENT_STUB env var. **RESOLVED §3.3** — explicit env-var override.
- **ISS-004 (info) Grandma growth.** Round-2: long-term DB size. **RESOLVED §10 row 12** — quarterly sweep.
- **ISS-005 (info) Multi-device sync lag.** Round-2: roster could be stale. **RESOLVED §10 row 9** — refresh on focus.
- **ISS-006 (warning) Offspring grace period.** Round-2: FR-PET-007 dependency. **RESOLVED §1.17 + §10 row 8** — cron job moves pending eggs.

## §4 — Strengths preserved

- DB trigger + app-layer = defense in depth.
- Downgrade-keeps-existing aligns with Apple/Google patterns.
- No individual-slot IAP keeps FR-LEGAL-002 clean.
- Grandma exclusion encourages rescue, not punishment.
- Migration script idempotent.
- Cross-tenant RLS aligned.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-PET-006/007/008 + FR-SOCIAL-003 now have inventory substrate.
