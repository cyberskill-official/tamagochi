---
fr_id: TASK-CARE-001
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

Starting 8.5/10 — server-authoritative feed spec with stage gate, ownership check, two-food catalogue, currency spend (stub at P1), cooldown via Redis sliding window, idempotency, stat apply, audit row, broadcast, animation token, haptic, rate limit, impossible-state detection, source attribution, no real-money food, per-category metrics. Round-1 surfaced two structural issues (Redis fail-closed behaviour, concurrent-feed race). Round-2 found four refinements (animation token forgery, Pet+ rate-limit headroom, audit retention, stage transition mid-cooldown).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Redis fail-closed behaviour unspecified.** Round-1 noted §1.6 used Redis cooldown but did not address Redis outage. **RESOLVED §10 row 1** — fail-closed (reject all feeds during outage); surface "service degraded" UX.

- **ISS-002 (error) Concurrent feed race.** Round-1 noted §1.5/§1.7 had multi-write stat mutation but did not address two simultaneous writes. **RESOLVED §10 row 4** — per-pet mutex in PetRoom (cross-ref TASK-PET-003 §10 row 12).

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Animation token forgery.** Round-2 noted §1.12 issued token but did not enforce client-side check. **RESOLVED §10 row 9** — Cocos rejects unsigned/invalid tokens; client cannot play animation without it.

- **ISS-004 (info) Pet+ rate-limit headroom.** Round-2 noted §1.14 set 60/hour but Pet+ owners with 10 pets need more. **RESOLVED §10 row 12** — 120/hour for Pet+ via TASK-SUB-001 entitlement check.

- **ISS-005 (info) Audit retention policy.** Round-2 noted §1.9 said 90 days analytics + 7 years kids but did not enforce. **RESOLVED §10 row 7** — Postgres retention policy + cold archive.

- **ISS-006 (info) Stage transition mid-cooldown.** Round-2 noted §1.6 was per-(pet, food) but did not address stage transitions. **RESOLVED §10 row 10** — cooldown is stage-agnostic; documented OK.

## §4 — Strengths preserved

- Server-authoritative + idempotency + cooldown + rate-limit = defence-in-depth.
- Food catalogue as single source of truth lets Mixpanel-flag tuning work without redeploy.
- Animation token ties UI animation to real server event.
- No real-money food respects TASK-LEGAL-002.
- Audit row + analytics event differentiate `source` (ui vs co_parent_remote vs offline_reconciled) — useful for funnel work.
- Impossible-state detection inherits TASK-INFRA-002 §1.9 anti-cheat.
- 90/7y retention satisfies COPPA + GDPR.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-CARE-001 is the template the other CARE actions follow.
