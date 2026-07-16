---
fr_id: TASK-CARE-004
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

Mini-game framework covers contract interface, per-game asset bundle (≤ 2 MB), server-seeded RNG + replay scoring, per-session + per-day payout caps, anti-replay + timeout, difficulty scaling, stat side-effects on win/loss, no real-money outcome, kids-SKU restrictions, A11Y baseline, cooldown between sessions, idempotent finish. 7 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Replay determinism risk.** Round-1: client + server RNG could drift due to event-loop variance. **RESOLVED §10 row 1** — tighten replay determinism + tolerance.
- **ISS-002 (warning) Daily cap counter Redis loss.** Round-1: counter unavailability could let exploitation. **RESOLVED §10 row 8** — fail-closed.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Coordinated exploit ring detection.** Round-2: score-mismatch flood from coordinated farm. **RESOLVED §10 row 12** — Sentry alert; investigate source IPs.
- **ISS-004 (info) Anti-cheat false positive.** Round-2: legitimate player might trip anti-cheat. **RESOLVED §10 row 5** — re-score manually; tolerance tuneable.
- **ISS-005 (info) Mini-game scene asset missing.** Round-2: CDN failure could block a game. **RESOLVED §10 row 10** — bundle-budget CI catches; fallback UX.
- **ISS-006 (info) A11Y audio cue missing.** Round-2: audio assets could miss license/coverage. **RESOLVED §10 row 11** — audio license ledger gate.
- **ISS-007 (warning) Per-session cap bypass.** Round-2: scoring bug could inflate payout. **RESOLVED §10 row 4** — replay test + ledger refund path.

## §4 — Strengths preserved

- Server-seeded RNG + replay = robust anti-cheat without client trust.
- Per-game asset bundle keeps cold-start tight.
- Payout caps preserve economy.
- 4 launch games (tap / memory / catch / rhythm) cover variety.
- A11Y baseline (audio cues + single-tap + reduce-motion) addresses Apple Kids + WCAG-AA.
- Difficulty scaling gives players agency.
- Kids-SKU no leaderboards aligns with COPPA-2025.
- TASK-B2B-004 (Techcombank tenant) extends cleanly via the contract.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. The contract interface is the load-bearing piece — P3+ new games drop in without framework churn.
