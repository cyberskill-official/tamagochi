---
fr_id: TASK-PET-004
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

Starting 8.5/10 — comprehensive onboarding spec covering 90s target, 5-step flow, persistent onboarding state with skip conditions, first-pat haptic conversion moment, kids-SKU adaptations, hatch ceremony no-skip-until-midpoint, A11Y reduce-motion path, localised copy in EN + VI, drop-off analytics with reasons, RLS, resume token, completion grants, deferred analytics identify. Round-1 found two structural gaps (UX hang on tutorial dismiss tap, missing-locale-key fallback). Round-2 found four refinements (first-pat API retry, build-target check on co-parent scene, completion grant flag-tunability, hatch animation load failure fallback).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) UX hang on tutorial dismiss tap.** Round-1 noted §1.2 step 5 had a single CTA but did not address the case of CTA tap not registering (touch event lost). **RESOLVED §10 row 9** — 60s auto-dismiss safety net + `tutorial.auto_dismissed` event.

- **ISS-002 (warning) Missing-locale-key fallback.** Round-1 noted §1.10 mandated EN + VI but did not specify fallback for a missing key. **RESOLVED §10 row 5** — auto-fallback to EN; report missing-key event for triage.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) First-pat API failure.** Round-2 noted §1.5 applied stat server-side but did not address API failure. **RESOLVED §10 row 3** — retry once + optimistic advance with reconciliation on next stat tick.

- **ISS-004 (info) Build-target check on co-parent scene.** Round-2 noted §1.11 said kids skips co-parent but the runtime guard wasn't specified. **RESOLVED §10 row 7** — Build-target check in scene init; hotfix path if breach detected.

- **ISS-005 (info) Completion grant amount tunability.** Round-2 noted §1.18 said 100 Coins but did not address tuning. **RESOLVED §11** — Mixpanel feature flag tunable; default 100.

- **ISS-006 (warning) Hatch animation load failure.** Round-2 noted §1.12 played hatch animation but did not address asset load failure. **RESOLVED §10 row 4** — fallback to static egg + auto-advance after 20 s.

## §4 — Strengths preserved

- 90s target aligns with plan + industry retention data.
- 5-step flow is the minimum that preserves bonding (steps 1-3) + viral seed (step 4) + explicit exit (step 5).
- Persistent state allows graceful resume across app kill / sign-out.
- First-pat haptic is the documented conversion moment.
- Co-parent stub at P1 captures intent data for P2 prioritisation without violating COPPA.
- No IAP gating respects Apple Guideline 3.1.3(b).
- Drop-off analytics with reason codes makes funnel actionable.
- Kids SKU adaptations (1.3× font, 88×88 pt taps, skipped co-parent) align with Apple Kids Category + UX research.
- Localised copy from day one for the VN soft launch.
- Analytics `identify` deferred until tutorial dismiss = PII consent boundary respected.
- Reduce-motion mode path preserves A11Y.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-PET-004 closes the P1 PET slice. After this, every gameplay task can assume the player has a fully-onboarded pet — the CARE tasks (P1) and SOCIAL tasks (P2) build on top.
