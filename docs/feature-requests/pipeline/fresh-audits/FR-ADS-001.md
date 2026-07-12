# FR-ADS-001 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local signed/device adapter coverage; production gate remains: LevelPlay/AppLovin SDK calls require ad-network credentials; local reward validation adapter is enforced in tests.
**Attempts:** 1
**Deliverables checked:** 9
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**External production gate:** LevelPlay/AppLovin SDK calls require ad-network credentials; local reward validation adapter is enforced in tests.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (5.133417ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.634625ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.33975ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.216208ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.453542ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.54925ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (1.491417ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.164583ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (6.793ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.706083ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.231083ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.30575ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 142.923584

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-ADS-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-ADS-001

✔ implementation registry covers every FR exactly once (1.553542ms)
✔ FR-LEGAL-001 acceptance contract (0.061208ms)
✔ FR-LEGAL-002 acceptance contract (0.167208ms)
✔ FR-LEGAL-003 acceptance contract (0.077667ms)
✔ FR-INFRA-001 acceptance contract (0.675958ms)
✔ FR-INFRA-002 acceptance contract (0.045583ms)
✔ FR-INFRA-003 acceptance contract (0.050291ms)
✔ FR-AUTH-001 acceptance contract (0.039792ms)
✔ FR-AUTH-002 acceptance contract (0.1ms)
✔ FR-AUTH-003 acceptance contract (0.071917ms)
✔ FR-OBS-001 acceptance contract (0.073542ms)
✔ FR-ART-001 acceptance contract (0.057167ms)
✔ FR-PET-001 acceptance contract (0.044375ms)
✔ FR-PET-002 acceptance contract (0.046208ms)
✔ FR-PET-003 acceptance contract (0.078958ms)
✔ FR-PET-004 acceptance contract (0.02975ms)
✔ FR-CARE-001 acceptance contract (0.041ms)
✔ FR-CARE-002 acceptance contract (0.033625ms)
✔ FR-CARE-003 acceptance contract (0.055833ms)
✔ FR-CARE-004 acceptance contract (0.046209ms)
✔ FR-CARE-005 acceptance contract (0.047292ms)
✔ FR-AI-001 acceptance contract (0.07675ms)
✔ FR-AI-002 acceptance contract (0.043833ms)
✔ FR-AR-001 acceptance contract (0.031667ms)
✔ FR-VIRAL-001 acceptance contract (0.030667ms)
✔ FR-PET-005 acceptance contract (0.076625ms)
✔ FR-PET-006 acceptance contract (0.02725ms)
✔ FR-PET-007 acceptance contract (0.084ms)
✔ FR-PET-008 acceptance contract (0.059833ms)
✔ FR-SOCIAL-001 acceptance contract (0.075667ms)
✔ FR-SOCIAL-002 acceptance contract (0.061875ms)
✔ FR-SOCIAL-003 acceptance contract (0.042667ms)
✔ FR-SOCIAL-004 acceptance contract (0.028625ms)
✔ FR-VIRAL-002 acceptance contract (0.036208ms)
✔ FR-VIRAL-003 acceptance contract (0.05ms)
✔ FR-ECON-001 acceptance contract (0.114167ms)
✔ FR-ECON-002 acceptance contract (0.033583ms)
✔ FR-ECON-003 acceptance contract (0.031125ms)
✔ FR-SUB-001 acceptance contract (0.031542ms)
✔ FR-SUB-002 acceptance contract (0.050583ms)
✔ FR-ADS-001 acceptance contract (0.058083ms)
✔ FR-ADS-002 acceptance contract (0.05225ms)
✔ FR-VIRAL-004 acceptance contract (0.027459ms)
✔ FR-VIRAL-005 acceptance contract (0.036875ms)
✔ FR-OBS-002 acceptance contract (0.048041ms)
✔ FR-I18N-001 acceptance contract (0.025709ms)
✔ FR-I18N-002 acceptance contract (0.030083ms)
✔ FR-A11Y-001 acceptance contract (0.037ms)
✔ FR-AI-003 acceptance contract (0.035084ms)
✔ FR-B2B-001 acceptance contract (0.024458ms)
✔ FR-B2B-002 acceptance contract (0.058084ms)
✔ FR-B2B-003 acceptance contract (0.021ms)
✔ FR-B2B-004 acceptance contract (0.021292ms)
✔ FR-B2B-005 acceptance contract (0.028416ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 136.480125

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (5.036792ms)
✔ E2E-007 web QA console serves live browser-ready artifact (111.606416ms)
✔ E2E-001 standard player hatch-to-share journey (2.934833ms)
✔ E2E-002 under-13 safe account and family journey (0.754291ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.35325ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (2.4685ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.998958ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 255.014917

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

