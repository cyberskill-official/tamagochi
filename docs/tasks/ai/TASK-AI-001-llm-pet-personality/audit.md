---
fr_id: TASK-AI-001
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

LLM persona spec covers Claude Haiku primary + Gemini Flash fallback, ≤300-token persona YAML, 20-event memory, structured-only prompts (no free-form user text), cost caps per-pet/per-player/per-tenant, 24h cache TTL, content-safety output gating, sentiment→animation mapping, kids-SKU exclusion. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Prompt-injection via persona YAML override.** Round-1: per-pet YAML override could be tampered. **RESOLVED §10 row 6** — schema strict; YAML files reviewed.
- **ISS-002 (warning) Sentiment-anim map drift.** Round-1: animation names could drift from TASK-ART-001 contract. **RESOLVED §10 row 12** — boot-time validation against contract names.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Both-vendor-down failure mode.** Round-2: scripted-only fallback needs UX. **RESOLVED §10 row 2** — "Mochi is sleepy today" UX.
- **ISS-004 (info) Cost-cap Redis loss → burst calls.** Round-2: counter loss could overspend. **RESOLVED §10 row 3** — conservative fallback: assume capped.
- **ISS-005 (info) Daily spend exceeding $50.** Round-2: budget breach needs response. **RESOLVED §10 row 8** — daily alert + tighten cap.
- **ISS-006 (warning) Kid mistakenly on standard SKU.** Round-2: SKU misdetection risk. **RESOLVED §10 row 11** — RLS + SKU gate via TASK-AUTH-003.

## §4 — Strengths preserved

- Two-vendor redundancy with documented fallback behaviour.
- Structured-only prompts close the prompt-injection surface.
- Cost-cap math (30/pet/day, 100/player/day) keeps API spend predictable.
- 24h Redis cache target ≥ 50% hit rate.
- 20-event rolling memory feeds context without bloating prompt.
- Sentiment→animation mapping integrates with TASK-ART-001 contract.
- Kids SKU exclusion respects Snap/Replika regulatory precedent.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-AI-001 is the unfair-advantage substrate per plan §PART 3 #3.
