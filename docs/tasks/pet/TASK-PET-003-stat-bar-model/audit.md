---
fr_id: TASK-PET-003
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

Starting 8.5/10 — extensive stat-bar spec covering 4-stat model with stage-aware decay, monotonic linear math, 24h offline cap, sleep-window passive energy recovery, TimescaleDB hypertable for stat history (90 day retention with compression after 7), care-action mutation table, server-authoritative computation, in-room tick, stat warning thresholds, full state on join, accessibility colour-blind palette, persistence cadence, clamp at handlers, feature-flag tunability, AI prompt context. Round-1 found two structural issues (concurrent care-action race, DST sleep-window transition). Round-2 found four refinements (stat-warning hysteresis, RLS on history table, retention policy failure mode, premium-food double-apply idempotency).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Concurrent care actions race.** Round-1 noted §1.4/§1.5 had server-side mutation but did not address two concurrent actions arriving at the same instant. **RESOLVED §10 row 12** — per-pet mutex in Colyseus room serialises updates; alternative optimistic concurrency conflict recovery documented.

- **ISS-002 (warning) DST sleep-window transition.** Round-1 noted §1.16 used local 22:00–07:00 but did not address DST. **RESOLVED §10 row 5** — IANA TZ data + recompute on TZ change.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Stat-warning event flood.** Round-2 noted §1.9 broadcast on crossing but did not specify hysteresis. **RESOLVED §10 row 8** — only fire on crossing the boundary, not on every tick while below.

- **ISS-004 (error) RLS on `pet_stat_history` not enforced.** Round-2 noted §1.18 mentioned co-parent visibility but the migration in §3.3 did not have an RLS policy that scoped to co-parent. **RESOLVED §3.3 + AC11** — RLS uses sub-select against `pets.owner_id = auth.uid()`; co-parent extension via TASK-SOCIAL-002 will widen.

- **ISS-005 (info) Retention policy could fail silently.** Round-2 noted §1.8 set retention policy but did not detect failure. **RESOLVED §10 row 10** — disk-growth alert + manual `add_retention_policy` recovery path.

- **ISS-006 (warning) Premium-food double-apply idempotency.** Round-2 noted §1.4 had care actions but did not address handler-level idempotency. **RESOLVED §10 row 9** — per-handler idempotency keys catch retried care actions.

## §4 — Strengths preserved

- 4-stat model maps cleanly to plan §PART 3 care primitives.
- Stage-aware decay rates make babies appropriately demanding without overwhelming adults.
- 24h offline cap is retention-protective (no empty pet on return).
- Sleep-window passive energy recovery aligns with "respect sleep hours" design principle.
- TimescaleDB hypertable handles the high-volume time-series cleanly (90d retention + 7d compression).
- Linear decay math is player-intuitable.
- Stat warning at 30→29 + critical at 10→9 gives the player two intervention windows.
- Server-authoritative computation closes the anti-cheat surface (no client stat writes).
- Care-action mutation table is the single source of truth for tuning.
- Co-parent visibility designed into the schema from P1 prevents P2 RLS retrofit.
- Colour-blind palette default prevents the green/red pitfall.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-PET-003 is the care-loop signal substrate. TASK-CARE-001/002/003/004/005 + TASK-PET-008 all depend on it.
