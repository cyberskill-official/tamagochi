---
fr_id: FR-INFRA-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.4/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.4/10 — a thorough Cocos scaffold spec covering engine pin, language pin, three build targets, SKU flag, 15 MB bundle budget, asset-bundle CDN loader with tenant slug, Editor extension, TurboRepo integration, strict TS, lint+format, reproducible builds, CI pipeline, headless CI, analytics-off, source-map handling, Fastfile, asset organisation, loader test. Round-1 surfaced two structural issues (tenant-slug default ambiguity, no source-map leak assertion). Round-2 found four refinements (reproducible build assertion missing, marketplace `.zip` lint not in CI, Editor extension fallback if lost, TS strict-flag enforcement test).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Tenant slug default ambiguous.** Round-1 noted `tenantSlug?: string` could resolve to `undefined` in `loadBundle`, leading to `https://cdn/undefined/bundle`. **RESOLVED §3.2** — default `slug = opts.tenantSlug ?? 'mochi'` (consumer tenant slug); the §11 cross-reference to FR-B2B-001 documents the slug taxonomy.

- **ISS-002 (warning) No assertion that source maps don't leak to web build output.** Round-1 noted §1.17 forbade source-map CDN exposure but no AC asserted absence. **RESOLVED AC11** — post-build glob assertion in `cocos-build.yml`.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Reproducible build not test-asserted.** Round-2 noted §1.13 demanded reproducibility but no test enforced it. **RESOLVED AC12** + `__tests__/reproducible-build.spec.ts` — two consecutive runs yield byte-identical artefacts (SHA-256 diff).

- **ISS-004 (warning) Marketplace `.zip` lint not wired into CI.** Round-2 noted §1.8 + §10 row 3 forbade `.zip` installs but no AC tied to CI. **RESOLVED AC10** + recipe in `.github/workflows/cocos-build.yml` (CI lint rejects `*.zip` under `vendored-plugins/`).

- **ISS-005 (info) Editor extension fallback if it fails to load.** Round-2 noted §1.9 added an Editor banner but did not cover the case of a broken extension. **RESOLVED §10 row 10** — Editor `--reset-extensions` + CI catches as fallback.

- **ISS-006 (warning) TS `strict` flag could be flipped off in a PR.** Round-2 noted §1.11 mandated strict mode but no AC enforced it. **RESOLVED AC4** + `__tests__/tsconfig.spec.ts` asserting both `strict: true` and `noUncheckedIndexedAccess: true`.

## §4 — Strengths preserved

- Engine pin to exact patch (3.8.4) prevents drift mid-phase.
- Bundle budget split (root 15 MB + tenant 4 MB + species 1.5 MB + mini-game 2 MB) covers both consumer and B2B cold-start scenarios.
- Tenant-slug threaded through the loader from day zero, eliminating a P4 refactor.
- TurboRepo integration aligns the new app with existing monorepo conventions.
- Cocos analytics disabled by default — major COPPA/PDPL exposure pre-empted.
- Reproducible builds explicitly tested.
- Marketplace-plugin policy (vendor or reject) is a CI-survivable supply-chain control.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This FR is the substrate for every visual / gameplay FR (FR-ART-001 → FR-PET-001 → all of P1). The scaffold is now reproducible, audit-friendly, and pre-emptively COPPA-safe.
