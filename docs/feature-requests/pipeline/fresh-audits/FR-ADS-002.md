# FR-ADS-002 Fresh Zero-Touch Audit

**Derived state:** shipped (10/10) + mocked-dependency
**Reason:** SuperAwesome kWS requires sandbox credentials; contextual-only policy is enforced local.
**Attempts:** 1
**Deliverables checked:** 6
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**Mocked dependency:** SuperAwesome kWS requires sandbox credentials; contextual-only policy is enforced local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (1.631166ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (0.601625ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.307416ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.182041ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (0.732958ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.447875ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.652125ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.132292ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (2.596791ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.200542ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.360625ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.35275ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 81.8045

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-ADS-002

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-ADS-002

✔ implementation registry covers every FR exactly once (0.791791ms)
✔ FR-LEGAL-001 acceptance contract (0.05625ms)
✔ FR-LEGAL-002 acceptance contract (0.164667ms)
✔ FR-LEGAL-003 acceptance contract (0.080958ms)
✔ FR-INFRA-001 acceptance contract (0.55725ms)
✔ FR-INFRA-002 acceptance contract (0.04575ms)
✔ FR-INFRA-003 acceptance contract (0.048208ms)
✔ FR-AUTH-001 acceptance contract (0.042625ms)
✔ FR-AUTH-002 acceptance contract (0.079417ms)
✔ FR-AUTH-003 acceptance contract (0.071958ms)
✔ FR-OBS-001 acceptance contract (0.167875ms)
✔ FR-ART-001 acceptance contract (0.071667ms)
✔ FR-PET-001 acceptance contract (0.048417ms)
✔ FR-PET-002 acceptance contract (0.048917ms)
✔ FR-PET-003 acceptance contract (0.063042ms)
✔ FR-PET-004 acceptance contract (0.021292ms)
✔ FR-CARE-001 acceptance contract (0.038958ms)
✔ FR-CARE-002 acceptance contract (0.034375ms)
✔ FR-CARE-003 acceptance contract (0.05675ms)
✔ FR-CARE-004 acceptance contract (0.046542ms)
✔ FR-CARE-005 acceptance contract (0.394792ms)
✔ FR-AI-001 acceptance contract (0.105917ms)
✔ FR-AI-002 acceptance contract (0.053417ms)
✔ FR-AR-001 acceptance contract (0.048167ms)
✔ FR-VIRAL-001 acceptance contract (0.038875ms)
✔ FR-PET-005 acceptance contract (0.091084ms)
✔ FR-PET-006 acceptance contract (0.029875ms)
✔ FR-PET-007 acceptance contract (0.09475ms)
✔ FR-PET-008 acceptance contract (0.052458ms)
✔ FR-SOCIAL-001 acceptance contract (0.126375ms)
✔ FR-SOCIAL-002 acceptance contract (0.089917ms)
✔ FR-SOCIAL-003 acceptance contract (0.056666ms)
✔ FR-SOCIAL-004 acceptance contract (0.039042ms)
✔ FR-VIRAL-002 acceptance contract (0.041541ms)
✔ FR-VIRAL-003 acceptance contract (0.054792ms)
✔ FR-ECON-001 acceptance contract (0.124792ms)
✔ FR-ECON-002 acceptance contract (0.0335ms)
✔ FR-ECON-003 acceptance contract (0.066416ms)
✔ FR-SUB-001 acceptance contract (0.066333ms)
✔ FR-SUB-002 acceptance contract (0.102ms)
✔ FR-ADS-001 acceptance contract (0.126292ms)
✔ FR-ADS-002 acceptance contract (0.052042ms)
✔ FR-VIRAL-004 acceptance contract (0.029625ms)
✔ FR-VIRAL-005 acceptance contract (0.035042ms)
✔ FR-OBS-002 acceptance contract (0.050375ms)
✔ FR-I18N-001 acceptance contract (0.026209ms)
✔ FR-I18N-002 acceptance contract (0.031041ms)
✔ FR-A11Y-001 acceptance contract (0.039833ms)
✔ FR-AI-003 acceptance contract (0.03825ms)
✔ FR-B2B-001 acceptance contract (0.030542ms)
✔ FR-B2B-002 acceptance contract (0.056167ms)
✔ FR-B2B-003 acceptance contract (0.021583ms)
✔ FR-B2B-004 acceptance contract (0.020708ms)
✔ FR-B2B-005 acceptance contract (0.019959ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 82.556208

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (3.436125ms)
✔ E2E-007 web QA console serves live browser-ready artifact (59.106375ms)
✔ E2E-001 standard player hatch-to-share journey (2.23075ms)
✔ E2E-002 under-13 safe account and family journey (0.5765ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.234208ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (1.649333ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.634166ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 157.7905

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

