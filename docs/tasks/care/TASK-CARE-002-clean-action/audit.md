---
fr_id: TASK-CARE-002
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

Clean action spec mirrors TASK-CARE-001 with clean-specific deltas (cleanliness +60/+85, energy -5), bubble particles, reduce-motion respect, lower rate-limit (30/hr). 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) `clean_premium` action key not in TASK-PET-003 stat-config.** Round-1: TASK-CARE-002 §1.7 references `clean_premium` but TASK-PET-003 §3.2 only has `clean`. **RESOLVED §7 + §11** — explicit cross-reference flagging the extension needed in TASK-PET-003 §3.2.
- **ISS-002 (warning) Energy hit at 0 before clean.** Round-1: §1.8 said energy can drop to 0, but didn't warn the user. **RESOLVED §10 row 4** — UX cue surfaces "Mochi too tired" pre-action.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Particle pool exhaustion under spam.** Round-2: rapid clean attempts could exhaust the particle pool. **RESOLVED §10 row 2** — pool extension or cap visual.
- **ISS-004 (info) Reduce-motion fail-default.** Round-2: a11y service errors might miss the preference. **RESOLVED §10 row 3** — default to reduced count on uncertainty.
- **ISS-005 (info) Particle texture missing.** Round-2: VFX asset could fail to load. **RESOLVED §10 row 7** — Lottie fallback or text "✨".
- **ISS-006 (info) Pet+ rate-limit headroom.** Round-2: 30/hr too tight for multi-pet users. **RESOLVED §10 row 8** — raise to 60/hr for Pet+ via TASK-SUB-001.

## §4 — Strengths preserved

- Pattern parity with TASK-CARE-001 — implementer follows the proven template.
- Reduce-motion respect built in from the start.
- Energy cost creates meaningful resource gradient.
- Cooldown values match stat-decay reality (cleanliness decays slower → longer cooldown).
- Co-parent + analytics + audit + idempotency aligned with TASK-CARE-001.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-CARE-002 + the TASK-PET-003 §3.2 `clean_premium` extension landing together.
