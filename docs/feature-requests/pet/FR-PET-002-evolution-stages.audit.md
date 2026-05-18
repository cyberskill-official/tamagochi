---
fr_id: FR-PET-002
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

Starting 8.5/10 — comprehensive evolution-stage spec covering wall-clock-resistant server-authoritative age timer, care-gated advancement, stage-gates as single source of truth, Spine skin swap at animation midpoint, TikTok-share moment, idempotent advancement via Postgres `where stage = $expected`, bulk catch-up scheduled function, sleep-hour push respect, stale-state reconciliation with sequential animations, care-stalled UX, no retrograde stages, feature-flag tunability. Round-1 found two structural gaps (skip-time anti-cheat detection, stale-state sequence pacing). Round-2 found four refinements (Postgres deadlock handling, feature-flag misconfiguration recovery, Cocos mid-animation reentry, kids-share-prompt disable verification).

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Skip-time anti-cheat detection.** Round-1 noted §1.10 acknowledged the anti-cheat risk but did not specify detection mechanism. **RESOLVED §10 row 2** — daily reconciliation comparing `born_at` against first `pet_age_events.observed_at`; DPO alert + service-role key rotation on detection.

- **ISS-002 (warning) Stale-state animation sequence pacing.** Round-1 noted §1.15 said "sequentially" but did not specify pacing. **RESOLVED §2 + §10 row 6** — 2-second pause between animations; UX test fixture asserts order.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Postgres deadlock on concurrent advancements.** Round-2 noted §1.4/§1.9 idempotency model could still deadlock under contention. **RESOLVED §10 row 11** — `for update skip locked` pattern; widen tick interval as fallback.

- **ISS-004 (warning) Feature-flag misconfig recovery.** Round-2 noted §1.19 said "tunable" but did not address bad-flag scenarios. **RESOLVED §10 row 9** — Mixpanel audit log review; manual reconciliation of affected pets.

- **ISS-005 (warning) Cocos mid-animation reentry.** Round-2 noted §1.7/§1.14 played animation but did not handle the player navigating away mid-animation. **RESOLVED §10 row 12** — snap to terminal frame on scene re-enter; Sentry on hang.

- **ISS-006 (info) Kids-share-prompt disable verification.** Round-2 noted §1.8 said "disabled on kids SKU" but did not assert. **RESOLVED AC10** — Playwright test with `BUILD_TARGET=kids` asserts share button absent.

## §4 — Strengths preserved

- Server-authoritative age computation eliminates the canonical Tamagotchi cheat (device-clock jumping).
- Care-gated evolution makes care meaningful — empty-care stalls stage advancement.
- Stage-gates centralised in `stage-gates.ts` — every action handler queries one source, no drift risk.
- Spine skin swap at animation midpoint hides the swap behind a particle burst.
- Idempotency via `update ... where stage = $expected` is a Postgres-native primitive.
- Bulk catch-up scheduled function handles offline players who skip the in-room tick.
- Sleep-hour push respect prevents 02:00 wake-ups.
- Stale-state reconciliation animates sequentially with pauses — preserves the celebration.
- Care-stalled UX is non-punitive and actionable — preempts FOMO trauma.
- `setNowForTest` seam disabled in production guards against runtime tampering.
- Feature-flag tunability lets soft-launch tune stage durations without redeploy.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-PET-002 is the pet-lifecycle substrate. With it, FR-PET-003 (stat decay rates vary by stage), FR-PET-007 (breeding requires adult), FR-PET-008 (Permadeath-Lite reads stage) all have a trustworthy foundation.
