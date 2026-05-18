# FR-AR-001 Fresh Zero-Touch Audit

**Derived state:** shipped (10/10) + mocked-dependency
**Reason:** ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.
**Attempts:** 1
**Deliverables checked:** 12
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**Mocked dependency:** ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (3.983083ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (0.58225ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.349708ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.20925ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (0.742125ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.440667ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.639791ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.133667ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (2.286667ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.198666ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.221708ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.284583ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 76.405

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AR-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AR-001

✔ implementation registry covers every FR exactly once (0.775125ms)
✔ FR-LEGAL-001 acceptance contract (0.057291ms)
✔ FR-LEGAL-002 acceptance contract (0.163625ms)
✔ FR-LEGAL-003 acceptance contract (0.079666ms)
✔ FR-INFRA-001 acceptance contract (0.56ms)
✔ FR-INFRA-002 acceptance contract (0.043459ms)
✔ FR-INFRA-003 acceptance contract (0.048917ms)
✔ FR-AUTH-001 acceptance contract (0.0485ms)
✔ FR-AUTH-002 acceptance contract (0.094583ms)
✔ FR-AUTH-003 acceptance contract (0.071958ms)
✔ FR-OBS-001 acceptance contract (0.069459ms)
✔ FR-ART-001 acceptance contract (0.054584ms)
✔ FR-PET-001 acceptance contract (0.039625ms)
✔ FR-PET-002 acceptance contract (0.0455ms)
✔ FR-PET-003 acceptance contract (0.077875ms)
✔ FR-PET-004 acceptance contract (0.030042ms)
✔ FR-CARE-001 acceptance contract (0.041041ms)
✔ FR-CARE-002 acceptance contract (0.034791ms)
✔ FR-CARE-003 acceptance contract (0.057375ms)
✔ FR-CARE-004 acceptance contract (0.04625ms)
✔ FR-CARE-005 acceptance contract (0.429333ms)
✔ FR-AI-001 acceptance contract (0.115625ms)
✔ FR-AI-002 acceptance contract (0.052458ms)
✔ FR-AR-001 acceptance contract (0.047125ms)
✔ FR-VIRAL-001 acceptance contract (0.036292ms)
✔ FR-PET-005 acceptance contract (0.084458ms)
✔ FR-PET-006 acceptance contract (0.029084ms)
✔ FR-PET-007 acceptance contract (0.082ms)
✔ FR-PET-008 acceptance contract (0.053959ms)
✔ FR-SOCIAL-001 acceptance contract (0.073166ms)
✔ FR-SOCIAL-002 acceptance contract (0.056083ms)
✔ FR-SOCIAL-003 acceptance contract (0.040584ms)
✔ FR-SOCIAL-004 acceptance contract (0.02725ms)
✔ FR-VIRAL-002 acceptance contract (0.036083ms)
✔ FR-VIRAL-003 acceptance contract (0.047ms)
✔ FR-ECON-001 acceptance contract (0.120167ms)
✔ FR-ECON-002 acceptance contract (0.031458ms)
✔ FR-ECON-003 acceptance contract (0.029458ms)
✔ FR-SUB-001 acceptance contract (0.034708ms)
✔ FR-SUB-002 acceptance contract (0.048584ms)
✔ FR-ADS-001 acceptance contract (0.050875ms)
✔ FR-ADS-002 acceptance contract (0.049416ms)
✔ FR-VIRAL-004 acceptance contract (0.026ms)
✔ FR-VIRAL-005 acceptance contract (0.033459ms)
✔ FR-OBS-002 acceptance contract (0.056584ms)
✔ FR-I18N-001 acceptance contract (0.025583ms)
✔ FR-I18N-002 acceptance contract (0.035375ms)
✔ FR-A11Y-001 acceptance contract (0.038ms)
✔ FR-AI-003 acceptance contract (0.035041ms)
✔ FR-B2B-001 acceptance contract (0.024625ms)
✔ FR-B2B-002 acceptance contract (0.053333ms)
✔ FR-B2B-003 acceptance contract (0.021458ms)
✔ FR-B2B-004 acceptance contract (0.021416ms)
✔ FR-B2B-005 acceptance contract (0.020292ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 80.091291

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.23225ms)
✔ E2E-007 web QA console serves live browser-ready artifact (53.016292ms)
✔ E2E-001 standard player hatch-to-share journey (3.434875ms)
✔ E2E-002 under-13 safe account and family journey (0.558834ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.228416ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (1.565875ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.811791ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 145.080333

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

