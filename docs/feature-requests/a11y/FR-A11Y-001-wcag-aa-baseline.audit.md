---
fr_id: FR-A11Y-001
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

WCAG-AA baseline — 4.5:1 contrast, 44/48/88pt tap targets, reduce-motion across 10 paths, colour-blind palette presets, OpenDyslexic option, VoiceOver/TalkBack labels, no flashing >3Hz, captions on AI, 30% text-expansion tolerance, annual external audit. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Photosensitive flashing.** Round-1. **RESOLVED §10 row 6** — frame-rate analysis.
- **ISS-002 (warning) Text overflow.** Round-1. **RESOLVED §10 row 7** — 30% expansion testing.

## §3 — Round-2 findings (resolved)

- **ISS-003 (info) OS bridge fail.** Round-2. **RESOLVED §10 row 9** — defaults fallback.
- **ISS-004 (info) Annual audit backlog.** Round-2. **RESOLVED §10 row 10** — prioritize.
- **ISS-005 (info) Kids 1.3× layout breakage.** Round-2. **RESOLVED §10 row 11** — CI test.
- **ISS-006 (info) Tenant override removes a11y.** Round-2. **RESOLVED §10 row 12** — lint blocks.

## §4 — Strengths preserved

- WCAG-AA aligns with Apple Kids + ICO AADC + EU EAA.
- Colour-independent feedback prevents green/red pitfall.
- Reduce-motion across documented paths.
- OpenDyslexic option respects neurodiverse users.
- Annual external audit catches regression.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept.
