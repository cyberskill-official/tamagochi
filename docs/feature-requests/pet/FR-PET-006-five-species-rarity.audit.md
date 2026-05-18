---
fr_id: FR-PET-006
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

5 species × 5 rarity tiers, earnable-only acquisition paths, FR-LEGAL-002 compliance (drop-rate disclosure + BE/NL safe mode + outcome receipts), tier decay modifier (-10% per tier capped at -30%), immutable tiers, single-source-of-truth catalogue, B2B tenant palette overrides only. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Tier upgrade via direct DB.** Round-1: a stray UPDATE could bypass immutability. **RESOLVED §10 row 3** — trigger rejects tier mutation post-creation.
- **ISS-002 (warning) Receipt write fails after coins spent.** Round-1: race could lose coins. **RESOLVED §10 row 8** — compensating transaction.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Drop-rate code/JSON drift.** Round-2: two-place-version risk. **RESOLVED §10 row 10** — SST + CI assert.
- **ISS-004 (info) Per-species bundle size.** Round-2: 5-palette texture overhead. **RESOLVED §10 row 5** — bundle-budget check.
- **ISS-005 (info) Tier-decay reconciliation.** Round-2: FR-PET-003 offline reconciliation. **RESOLVED §10 row 6** — modifier applied consistently.
- **ISS-006 (info) Tenant override breaking tiers.** Round-2: FR-B2B-001 risk. **RESOLVED §10 row 12** — schema lint on tenant manifest.

## §4 — Strengths preserved

- Earnable-only acquisition closes FR-LEGAL-002 surface.
- Drop-rate disclosure + BE/NL safe mode pre-empts EU regulator.
- Tier immutability preserves rarity meaning.
- Tier-decay modifier is felt but not pay-to-win.
- Catalogue SST simplifies tuning.
- Outcome receipts retained 7 years per FR-LEGAL-002.
- Tenant overrides ride atop without breaking model.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-PET-007 breeding now has species+tier surface.
