---
fr_id: TASK-AI-002
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

Content safety with two-vendor architecture (OpenAI Moderation + Azure Content Safety), category-based scoring, zero-tolerance for sexual/minors, kids-SKU scripted dialogue tree replacement (30+ phrases per trigger per stage per locale, EN+VI), PII regex on top of API, DPO review queue, fail-closed on outage, latency budget, per-tenant rate-limit. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Kid-SKU bypass race.** Round-1: SKU detection could fail in edge cases. **RESOLVED §10 row 11** — RLS + SKU gate hardened.
- **ISS-002 (warning) Cache poisoning.** Round-1: vendor returning wrong cached → stale blocks. **RESOLVED §10 row 7** — TTL bounds blast radius.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Scripted phrase repetition.** Round-2: 30 phrases per trigger might still feel repetitive. **RESOLVED §10 row 5** — add via i18n batch process.
- **ISS-004 (info) PII regex false-positive.** Round-2: legitimate text with numbers. **RESOLVED §10 row 6** — refine + audit.
- **ISS-005 (info) DPO review queue bloat.** Round-2: queue grows unbounded. **RESOLVED §10 row 9** — throttle + alert.
- **ISS-006 (info) Sexual/minors false-positive.** Round-2: 0.1 threshold could over-block. **RESOLVED §10 row 12** — DPO review; adjust.

## §4 — Strengths preserved

- Universal output gate (every LLM call passes through).
- Two-vendor redundancy.
- Zero-tolerance for sexual/minors at 0.1.
- Kids-SKU completely replaces generative with scripted.
- PII regex layer catches structured PII regardless of context.
- Fail-closed on vendor outage = correct conservative behaviour.
- 30+ phrases per trigger per stage + EN + VI authored.
- DPO review queue captures edge cases for tuning.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-AI-002 closes the AI safety story. TASK-VIRAL-002/003 + TASK-AI-003 build on top.
