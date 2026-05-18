# FR-ADS-001 Fresh Zero-Touch Audit

**Derived state:** shipped (10/10) + mocked-dependency
**Reason:** LevelPlay/AppLovin SDK calls require ad-network credentials; reward validation is mocked local.
**Attempts:** 1
**Deliverables checked:** 9
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**Mocked dependency:** LevelPlay/AppLovin SDK calls require ad-network credentials; reward validation is mocked local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (2.229042ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (0.534083ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.376416ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.193333ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (0.734625ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.453834ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.643166ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.129792ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (2.493333ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.206875ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.221708ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.284208ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.645333

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-ADS-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-ADS-001

✔ implementation registry covers every FR exactly once (0.790666ms)
✔ FR-LEGAL-001 acceptance contract (0.0565ms)
✔ FR-LEGAL-002 acceptance contract (0.157916ms)
✔ FR-LEGAL-003 acceptance contract (0.083667ms)
✔ FR-INFRA-001 acceptance contract (0.547625ms)
✔ FR-INFRA-002 acceptance contract (0.044917ms)
✔ FR-INFRA-003 acceptance contract (0.050625ms)
✔ FR-AUTH-001 acceptance contract (0.045041ms)
✔ FR-AUTH-002 acceptance contract (0.095334ms)
✔ FR-AUTH-003 acceptance contract (0.074125ms)
✔ FR-OBS-001 acceptance contract (0.069792ms)
✔ FR-ART-001 acceptance contract (0.055083ms)
✔ FR-PET-001 acceptance contract (0.044125ms)
✔ FR-PET-002 acceptance contract (0.063459ms)
✔ FR-PET-003 acceptance contract (0.066042ms)
✔ FR-PET-004 acceptance contract (0.024417ms)
✔ FR-CARE-001 acceptance contract (0.036084ms)
✔ FR-CARE-002 acceptance contract (0.032333ms)
✔ FR-CARE-003 acceptance contract (0.055125ms)
✔ FR-CARE-004 acceptance contract (0.055041ms)
✔ FR-CARE-005 acceptance contract (0.360875ms)
✔ FR-AI-001 acceptance contract (0.120625ms)
✔ FR-AI-002 acceptance contract (0.108125ms)
✔ FR-AR-001 acceptance contract (0.063417ms)
✔ FR-VIRAL-001 acceptance contract (0.044ms)
✔ FR-PET-005 acceptance contract (0.084042ms)
✔ FR-PET-006 acceptance contract (0.030709ms)
✔ FR-PET-007 acceptance contract (0.082292ms)
✔ FR-PET-008 acceptance contract (0.048791ms)
✔ FR-SOCIAL-001 acceptance contract (0.067375ms)
✔ FR-SOCIAL-002 acceptance contract (0.055541ms)
✔ FR-SOCIAL-003 acceptance contract (0.035375ms)
✔ FR-SOCIAL-004 acceptance contract (0.024542ms)
✔ FR-VIRAL-002 acceptance contract (0.032333ms)
✔ FR-VIRAL-003 acceptance contract (0.046666ms)
✔ FR-ECON-001 acceptance contract (0.100166ms)
✔ FR-ECON-002 acceptance contract (0.03175ms)
✔ FR-ECON-003 acceptance contract (0.025792ms)
✔ FR-SUB-001 acceptance contract (0.032834ms)
✔ FR-SUB-002 acceptance contract (0.04125ms)
✔ FR-ADS-001 acceptance contract (0.066334ms)
✔ FR-ADS-002 acceptance contract (0.040833ms)
✔ FR-VIRAL-004 acceptance contract (0.035959ms)
✔ FR-VIRAL-005 acceptance contract (0.036375ms)
✔ FR-OBS-002 acceptance contract (0.065125ms)
✔ FR-I18N-001 acceptance contract (0.020667ms)
✔ FR-I18N-002 acceptance contract (0.025666ms)
✔ FR-A11Y-001 acceptance contract (0.032917ms)
✔ FR-AI-003 acceptance contract (0.029833ms)
✔ FR-B2B-001 acceptance contract (0.021458ms)
✔ FR-B2B-002 acceptance contract (0.049083ms)
✔ FR-B2B-003 acceptance contract (0.019959ms)
✔ FR-B2B-004 acceptance contract (0.017959ms)
✔ FR-B2B-005 acceptance contract (0.019292ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 82.535917

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.03325ms)
✔ E2E-007 web QA console serves live browser-ready artifact (52.331916ms)
✔ E2E-001 standard player hatch-to-share journey (2.717833ms)
✔ E2E-002 under-13 safe account and family journey (0.705291ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.313417ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (1.490583ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.637584ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 142.564

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

