---
fr_id: TASK-ECON-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 7
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Currency ledger with two currencies (soft Coins + premium Hearts), double-entry, SERIALIZABLE + advisory-lock concurrency, no overdraft, no Coins↔Hearts conversion, daily reconciliation drift alert, server-authoritative, tenant-scoped. 7 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Concurrent double-spend.** Round-1: parallel spends could both pass balance check. **RESOLVED §1.7 + §3** — Postgres advisory lock + SERIALIZABLE.
- **ISS-002 (warning) Daily reconciliation untested.** Round-1: drift detection needs proof. **RESOLVED AC8** — chaos test injecting drift.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Timezone shift Coin cap exploit.** Round-2. **RESOLVED §10 row 8** — lock day boundary to user region.
- **ISS-004 (info) SERIALIZABLE deadlock spike.** Round-2. **RESOLVED §10 row 3** — retry with backoff.
- **ISS-005 (info) Cascade delete on user_id.** Round-2: lose ledger evidence. **RESOLVED §10 row 11** — RESTRICT + tombstone via DSR path.
- **ISS-006 (info) Daily Coin cap Mixpanel-tunable.** Round-2. **RESOLVED §11** — explicit note.
- **ISS-007 (warning) IAP forgery → Hearts grant.** Round-2. **RESOLVED §10 row 9** — TASK-ECON-002 validation.

## §4 — Strengths preserved

- Double-entry sum-to-zero invariant catches bugs.
- Derived balance + cached summary is performance-correct.
- Advisory lock prevents concurrent double-spend at DB layer.
- Two-currency model aligns with f2p standard.
- No Coins↔Hearts conversion closes gambling-adjacent surface.
- Daily reconciliation surfaces silent drift.
- Tenant-scoped from day one.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-ECON-002/003/SUB-001/ADS-001/VIRAL-004 build on this.
