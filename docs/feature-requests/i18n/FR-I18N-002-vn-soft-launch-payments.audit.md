---
fr_id: FR-I18N-002
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

VN/PH/ID payment rails — Antom MoR for VN (MoMo/ZaloPay/VNPay/ViettelPay), Xsolla MoR for PH (GCash) + ID (DANA), one-off IAP only (no subscriptions), tax-inclusive display, region-match anti-fraud, DPA on file. 6 ISS resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) DLT/BIR compliance.** Round-1. **RESOLVED §10 row 6** — Xsolla MoR.
- **ISS-002 (warning) DPA expiration.** Round-1. **RESOLVED §10 row 7** — annual re-execution.

## §3 — Round-2 findings (resolved)

- **ISS-003 (info) Subscription via local.** Round-2. **RESOLVED §10 row 10** — validation enforced.
- **ISS-004 (info) Region-mismatch FP.** Round-2. **RESOLVED §10 row 5** — DPO reverse.
- **ISS-005 (info) Refund propagation.** Round-2. **RESOLVED §10 row 11** — daily reconciliation.
- **ISS-006 (info) Currency formatting.** Round-2. **RESOLVED §10 row 12** — ICU correction.

## §4 — Strengths preserved

- MoR architecture handles tax + compliance + dispute.
- Tax-inclusive display VN-compliant.
- Subscriptions stay in-store per Apple/Google.
- Region-match anti-fraud.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. I18N slice complete.
