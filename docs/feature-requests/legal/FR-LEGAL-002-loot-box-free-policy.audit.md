---
fr_id: FR-LEGAL-002
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

Starting state: a tight, opinionated 8.5/10 policy spec covering the loot-box-free posture with ESLint enforcement, drop-rate disclosure, deterministic breeding, free rescue, daily reconciliation, BE/NL safe mode, and a 7-year receipt audit trail. Round-1 found two structural gaps (no IAP-catalogue lint script wiring, missing daily-reconciliation job liveness check). Round-2 surfaced four subtler issues (RNG bias around floating-point comparisons, retention-policy GDPR/PDPL proportionality, HMAC key rotation procedure undefined, missing property-test for breeding determinism). All 6 resolved; final 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) IAP catalogue lint not wired into CI.** Round-1 noted §1.11 mandated the lint script but no AC asserted it ran in CI. **RESOLVED AC8** added — `lint-iap-catalogue-against-loot-box-rules.mjs` is required to exit non-zero on a fixture catalogue containing `outcome_type: "random"` and to be wired into CI.

- **ISS-002 (warning) Daily reconciliation job liveness not monitored.** Round-1 noted §1.9 mandated the daily job but did not require monitoring its existence (Redis/queue outage could silently skip it). **RESOLVED §10 row 12** — synthetic monitor `legal.reconcile.daily.missing` mandated with explicit recovery path.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Drop-rate proportionality not justified under PDPL data-minimisation.** Round-2 raised the question of whether 7-year receipt retention is proportionate to the purpose under PDPL Article 14. **RESOLVED §9 OQ-2** — explicitly addresses retention proportionality (player_id is pseudo-anonymous foreign key; no name/email at rest; audit-trail purpose is documented).

- **ISS-004 (error) RNG bias risk in cumulative-weight comparison.** Round-2 noted the §6 implementation used `cfg.outcomes.find(o => (acc += o.weight) >= u)` — fine for the weights given, but a future weight set summing >1.0 or <1.0 could silently produce wrong outcomes. **RESOLVED §3.4 + §6** by mandating a precondition test (`sum of weights === 1.0 ± 1e-9`) at config-load time; downstream tooling fixed in implementation skeleton.

- **ISS-005 (warning) HMAC rotation procedure undefined.** Round-2 noted §1.13 signed the public drop-rate JSON with an HMAC but did not specify rotation. **RESOLVED §10 row 6** — rotation via documented procedure with overlap window; publish new HMAC fingerprint when rotating.

- **ISS-006 (warning) Breeding determinism asserted but not property-tested.** Round-2 noted §1.6 claimed determinism but no AC enforced it. **RESOLVED AC10** added — 1,000-pair fast-check property-test asserting identical-inputs-yield-identical-outputs.

## §4 — Strengths preserved

- Absolute "no real-money randomisation" rule with crisp scope: explicitly enumerates every PSP path (Apple IAP, Google IAP, MoMo, ZaloPay, VNPay, ViettelPay, Stripe, Paddle) so no PSP can slip through unaddressed.
- ESLint custom rule (§3.5) is a CI-survivable enforcement mechanism that survives team turnover.
- The §1.12 BE/NL safe mode is genuinely defensive — earned-currency randomisation is legal but marketing-surface hiding is a cheap insurance policy.
- The 7-year audit-trail aligns with Belgian Kansspelcommissie expectation without overcommitting to a heavier compliance regime.
- The cross-reference at §11 to downstream FRs is explicit — FR-PET-006/007/008, FR-ECON-002, FR-VIRAL-004 cannot proceed coherently without this spec.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. Ship verdict: FR-LEGAL-002 locks the monetisation regulatory envelope for the entire project. Without it, FR-PET-006 (rarity tiers), FR-PET-008 (Permadeath-Lite revival), FR-ECON-002 (IAP catalogue), and FR-VIRAL-004 (battle pass) cannot be coherently authored.
