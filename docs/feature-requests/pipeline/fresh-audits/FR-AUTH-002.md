# FR-AUTH-002 Fresh Zero-Touch Audit

**Derived state:** shipped (10/10) + mocked-dependency
**Reason:** Zalo OA approval and OAuth credentials are external; mocked bearer validation is local.
**Attempts:** 1
**Deliverables checked:** 14
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**Mocked dependency:** Zalo OA approval and OAuth credentials are external; mocked bearer validation is local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (4.353083ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (0.528208ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.314708ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.198417ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (0.766667ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.457417ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.715ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.13025ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.275708ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.207291ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.23025ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.288208ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 80.598083

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AUTH-002

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AUTH-002

✔ implementation registry covers every FR exactly once (0.789167ms)
✔ FR-LEGAL-001 acceptance contract (0.068333ms)
✔ FR-LEGAL-002 acceptance contract (0.164667ms)
✔ FR-LEGAL-003 acceptance contract (0.084542ms)
✔ FR-INFRA-001 acceptance contract (0.617083ms)
✔ FR-INFRA-002 acceptance contract (0.046ms)
✔ FR-INFRA-003 acceptance contract (0.053208ms)
✔ FR-AUTH-001 acceptance contract (0.044083ms)
✔ FR-AUTH-002 acceptance contract (0.089084ms)
✔ FR-AUTH-003 acceptance contract (0.075333ms)
✔ FR-OBS-001 acceptance contract (0.068416ms)
✔ FR-ART-001 acceptance contract (0.056083ms)
✔ FR-PET-001 acceptance contract (0.04475ms)
✔ FR-PET-002 acceptance contract (0.0485ms)
✔ FR-PET-003 acceptance contract (0.079542ms)
✔ FR-PET-004 acceptance contract (0.029875ms)
✔ FR-CARE-001 acceptance contract (0.041709ms)
✔ FR-CARE-002 acceptance contract (0.033166ms)
✔ FR-CARE-003 acceptance contract (0.058292ms)
✔ FR-CARE-004 acceptance contract (0.044583ms)
✔ FR-CARE-005 acceptance contract (0.33975ms)
✔ FR-AI-001 acceptance contract (0.070833ms)
✔ FR-AI-002 acceptance contract (0.04225ms)
✔ FR-AR-001 acceptance contract (0.033125ms)
✔ FR-VIRAL-001 acceptance contract (0.030125ms)
✔ FR-PET-005 acceptance contract (0.07825ms)
✔ FR-PET-006 acceptance contract (0.026208ms)
✔ FR-PET-007 acceptance contract (0.076042ms)
✔ FR-PET-008 acceptance contract (0.049125ms)
✔ FR-SOCIAL-001 acceptance contract (0.073625ms)
✔ FR-SOCIAL-002 acceptance contract (0.05925ms)
✔ FR-SOCIAL-003 acceptance contract (0.039333ms)
✔ FR-SOCIAL-004 acceptance contract (0.029625ms)
✔ FR-VIRAL-002 acceptance contract (0.033458ms)
✔ FR-VIRAL-003 acceptance contract (0.041167ms)
✔ FR-ECON-001 acceptance contract (0.101916ms)
✔ FR-ECON-002 acceptance contract (0.032541ms)
✔ FR-ECON-003 acceptance contract (0.029667ms)
✔ FR-SUB-001 acceptance contract (0.03775ms)
✔ FR-SUB-002 acceptance contract (0.042375ms)
✔ FR-ADS-001 acceptance contract (0.051708ms)
✔ FR-ADS-002 acceptance contract (0.036458ms)
✔ FR-VIRAL-004 acceptance contract (0.031709ms)
✔ FR-VIRAL-005 acceptance contract (0.033084ms)
✔ FR-OBS-002 acceptance contract (0.043541ms)
✔ FR-I18N-001 acceptance contract (0.021ms)
✔ FR-I18N-002 acceptance contract (0.026ms)
✔ FR-A11Y-001 acceptance contract (0.033584ms)
✔ FR-AI-003 acceptance contract (0.032709ms)
✔ FR-B2B-001 acceptance contract (0.02375ms)
✔ FR-B2B-002 acceptance contract (0.048667ms)
✔ FR-B2B-003 acceptance contract (0.020208ms)
✔ FR-B2B-004 acceptance contract (0.021625ms)
✔ FR-B2B-005 acceptance contract (0.019708ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 80.373083

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (6.391708ms)
✔ E2E-007 web QA console serves live browser-ready artifact (53.2635ms)
✔ E2E-001 standard player hatch-to-share journey (3.852791ms)
✔ E2E-002 under-13 safe account and family journey (0.641166ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.240458ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (1.643041ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.621292ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 147.415083

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

