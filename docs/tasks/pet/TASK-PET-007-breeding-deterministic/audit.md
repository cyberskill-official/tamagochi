---
fr_id: TASK-PET-007
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

Breeding system with deterministic SHA256-seeded trait inheritance (species 50/50, tier 80/15/5 upgrade, palette XOR, stat bias), 24h incubation, 48h grace if slot full, 7-day cooldown (Pet+ -50%), same-tenant + same-player only at P2. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Stage race during incubation.** Round-1: pet could change stage between breed and hatch. **RESOLVED §10 row 11** — lock pet stage during incubation.
- **ISS-002 (warning) Receipt-after-spend saga.** Round-1: failure between coin spend and receipt write. **RESOLVED §10 row 8** — saga pattern + compensating refund.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Slot-full grace UX.** Round-2: player needs clear path. **RESOLVED §10 row 3** — soft warning 1h before expiry.
- **ISS-004 (info) Cooldown Redis loss.** Round-2: counter loss. **RESOLVED §10 row 4** — conservative fallback.
- **ISS-005 (info) Node SHA256 bug.** Round-2: rare cross-version issue. **RESOLVED §10 row 1** — pin Node + CI test.
- **ISS-006 (info) Palette XOR collision.** Round-2: rare visual sameness. **RESOLVED §10 row 6** — acceptable by design.

## §4 — Strengths preserved

- Deterministic per TASK-LEGAL-002 §1.6 — audit-replayable.
- 80/15/5 tier-upgrade balances predictability + delight.
- 24h incubation creates anticipation.
- 48h grace prevents punishing offspring loss.
- Property-based testing catches non-determinism.
- Self-breeding + cross-tenant forbidden.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-VIRAL-003 generative pet is the parallel mechanism.
