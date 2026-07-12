---
fr_id: FR-ECON-002
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

IAP catalogue with direct-purchase only, Apple StoreKit 2 + Google Play Billing 6 + Antom MoR for VN, server-side receipt validation, duplicate-receipt protection, 7-day freshness check, atomic item delivery, refund webhook, Family Sharing for kids. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Sandbox→prod receipt crossing.** Round-1: dev receipts could leak. **RESOLVED §10 row 10 + §1.10** — environment detection.
- **ISS-002 (warning) Refund webhook reliability.** Round-1: missed refunds. **RESOLVED §10 row 4** — daily reconciliation catches.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Antom integration outage.** Round-2. **RESOLVED §10 row 3** — Stripe fallback.
- **ISS-004 (info) Localised pricing wrong.** Round-2. **RESOLVED §10 row 8** — manual review + hot-fix.
- **ISS-005 (info) Apple Server API down.** Round-2. **RESOLVED §10 row 1** — retry with backoff.
- **ISS-006 (info) Family Sharing bypass.** Round-2. **RESOLVED §10 row 9** — OS-level enforcement.

## §4 — Strengths preserved

- Direct-purchase only respects FR-LEGAL-002.
- Server-side receipt validation + duplicate protection closes fraud surface.
- VN payment via Antom MoR (1.5-2% MDR vs 30% Apple/Google) saves on margin.
- Atomic item + currency grant.
- IAP gating during onboarding respects Apple Guideline 3.1.3(b).
- Family Sharing path for kids.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-SUB-001, FR-ECON-003, FR-VIRAL-004 now have IAP path.
